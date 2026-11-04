import { getAuth } from "@clerk/express";
import {
  GetMyStudentProfileResponse,
  ListCommunityStudentProfilesResponse,
  SaveMyStudentProfileBody,
  SaveMyStudentProfileResponse,
} from "@workspace/api-zod";
import {
  db,
  studentProfilesTable,
  type StudentProfile as StoredStudentProfile,
} from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";

const router: IRouter = Router();

function requireSignedInStudent(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to access student profiles." });
    return;
  }
  res.locals.userId = userId;
  next();
}

function profileResponse(profile: StoredStudentProfile) {
  return {
    id: profile.id,
    fullName: profile.fullName,
    origin: profile.origin,
    university: profile.university,
    chinaCity: profile.chinaCity,
    interests: profile.interests,
    contact: profile.contact,
    shareWithCommunity: profile.shareWithCommunity,
    shareContact: profile.shareContact,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

router.get(
  "/student-profile/me",
  requireSignedInStudent,
  async (_req, res): Promise<void> => {
    const [profile] = await db
      .select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.clerkUserId, res.locals.userId as string))
      .limit(1);

    res.json(
      GetMyStudentProfileResponse.parse({
        profile: profile ? profileResponse(profile) : null,
      }),
    );
  },
);

router.put(
  "/student-profile/me",
  requireSignedInStudent,
  async (req, res): Promise<void> => {
    const parsed = SaveMyStudentProfileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Check the profile fields and try again." });
      return;
    }

    const data = {
      fullName: parsed.data.fullName.trim(),
      origin: parsed.data.origin.trim(),
      university: parsed.data.university.trim(),
      chinaCity: parsed.data.chinaCity.trim(),
      interests: parsed.data.interests.map((interest) => interest.trim()).filter(Boolean),
      contact: parsed.data.contact?.trim() || null,
      shareWithCommunity: parsed.data.shareWithCommunity,
      shareContact: parsed.data.shareContact,
    };

    if (
      !data.fullName ||
      !data.origin ||
      !data.university ||
      !data.chinaCity ||
      data.interests.length === 0
    ) {
      res.status(400).json({ error: "Required profile fields cannot be blank." });
      return;
    }

    if (data.shareContact && (!data.shareWithCommunity || !data.contact)) {
      res.status(400).json({
        error: "Sharing contact requires a community-visible profile and a contact value.",
      });
      return;
    }

    const [profile] = await db
      .insert(studentProfilesTable)
      .values({
        clerkUserId: res.locals.userId as string,
        ...data,
      })
      .onConflictDoUpdate({
        target: studentProfilesTable.clerkUserId,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();

    res.json(SaveMyStudentProfileResponse.parse(profileResponse(profile)));
  },
);

router.get(
  "/student-profiles",
  requireSignedInStudent,
  async (_req, res): Promise<void> => {
    const profiles = await db
      .select({
        id: studentProfilesTable.id,
        fullName: studentProfilesTable.fullName,
        origin: studentProfilesTable.origin,
        university: studentProfilesTable.university,
        chinaCity: studentProfilesTable.chinaCity,
        interests: studentProfilesTable.interests,
        contact: studentProfilesTable.contact,
        shareContact: studentProfilesTable.shareContact,
      })
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.shareWithCommunity, true))
      .orderBy(desc(studentProfilesTable.updatedAt))
      .limit(100);

    res.json(
      ListCommunityStudentProfilesResponse.parse({
        profiles: profiles.map((profile) => ({
          id: profile.id,
          fullName: profile.fullName,
          origin: profile.origin,
          university: profile.university,
          chinaCity: profile.chinaCity,
          interests: profile.interests,
          contact: profile.shareContact ? profile.contact : null,
        })),
      }),
    );
  },
);

export default router;
