import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Box, Check, CircleHelp, Compass, Globe2, Languages, Menu, MessageCircle, PackageCheck, Search, ShieldCheck, Ship, Sparkles, Users, X } from 'lucide-react';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  getGetMyStudentProfileQueryKey,
  getListCommunityStudentProfilesQueryKey,
  useGetMyStudentProfile,
  useListCommunityStudentProfiles,
  useSaveMyStudentProfile,
} from '@workspace/api-client-react';
import type { StudentProfile } from '@workspace/api-client-react';
import { Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';

type Language = 'en' | 'ar';

type ProfileDraft = {
  fullName: string;
  origin: string;
  university: string;
  chinaCity: string;
  interestsText: string;
  contact: string;
  shareWithCommunity: boolean;
  shareContact: boolean;
};

const emptyProfileDraft: ProfileDraft = {
  fullName: '',
  origin: '',
  university: '',
  chinaCity: '',
  interestsText: '',
  contact: '',
  shareWithCommunity: false,
  shareContact: false,
};

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const queryClient = new QueryClient();

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

const copy = {
  en: {
    navHome: 'Home', navCourses: 'Courses', navGuides: 'Guides', navContact: 'Contact', navCommunity: 'Community', navHow: 'How it works', navWhy: 'Why this guide', navShipping: 'Shipping basics', join: 'Join',
    bannerOneTitle: 'Learn Sourcing in China', bannerOneSub: 'A step-by-step guide for new students: find suppliers, negotiate, and ship safely', bannerOneButton: 'Start Now',
    bannerTwoTitle: 'Student Sourcing Courses', bannerTwoSub: 'Practical lessons in Arabic and English', bannerTwoButton: 'Browse Courses',
    productImageAlt: 'Product samples and shipping carton on a dark podium', courseImageAlt: 'Laptop and phone displaying a glowing map of China on a dark podium', mainNavLabel: 'Main navigation', footerNavLabel: 'Footer navigation', bannersLabel: 'Student sourcing introductions',
    courseKicker: 'Learn at your own pace', courseTitle: 'Student sourcing courses', courseIntro: 'A simple course hub for the skills behind a first order.', courseCardTitle: 'Start with the sourcing essentials', courseCardBody: 'A course outline is being prepared. No course catalog or enrollment service is connected in this demo.', courseLabel: 'Course preview · Coming soon',
    directoryTitle: 'Shipping contact directory', directoryEmpty: 'No verified shipping partner contacts have been supplied yet.', directoryNote: 'We will not list a carrier or contact until details can be independently confirmed. Ask suppliers for written routing options and compare them for your destination.',
    eyebrow: 'A student’s first sourcing guide',
    headlineA: 'Find your first', headlineAccent: 'factory in China.', heroSub: 'A calmer way to go from “I need this” to a supplier conversation you understand. Built for students finding their feet—and their first product.',
    ctaSearch: 'Search 1688', ctaGuide: 'Explore the guide', note: 'Independent field guide · No supplier affiliation',
    searchPlaceholder: 'What are you looking for?', searchLabel: 'Search product listings on 1688', sourceHint: 'Opens 1688 in a new tab. Search results are not endorsements.',
    tagProduct: 'Product idea', tagFactory: 'Factory questions', tagShipment: 'Shipping routes',
    trust1: 'Start with a clear product brief', trust2: 'Ask better supplier questions', trust3: 'Compare shipping before paying',
    howKicker: 'A practical starting point', howTitle: 'From curiosity to a confident first order.', howIntro: 'No magic shortcuts. Just a useful sequence for learning the landscape, checking what you can, and asking the right questions.',
    steps: [
      ['01', 'Name what you need', 'Write down the product, target quantity, material, and the must-haves. A clear brief gets clearer answers.'],
      ['02', 'Search beyond the photo', 'Try product keywords on 1688. Compare listings, specifications, minimum quantities, and seller details.'],
      ['03', 'Ask, then verify', 'Request a current quote and business details. A listing or chat is not proof that a seller is a factory.'],
      ['04', 'Plan the journey', 'Confirm samples, payment terms, packing, destination, and shipping costs before placing an order.']
    ],
    whyKicker: 'Made for your first time', whyTitle: 'Less guesswork. More useful questions.', whyBody: 'You are new to China, not new to good judgment. This field guide turns an unfamiliar sourcing process into steps you can actually take—without pretending that every supplier is verified or every shipment is simple.',
    whyTags: ['Plain-language guidance', 'Factory-check questions', 'No paid supplier rankings', 'Student-first context'],
    originKicker: 'Your starting point matters', originTitle: 'A student in China is already closer to the source.', originP1: 'Whether you arrived from Cairo, Amman, Lagos, Jakarta, or somewhere else, you can learn the basics at your own pace. Start small: understand the product, ask for evidence, and keep every important detail in writing.', originP2: 'Use your campus network and local support when it helps—but verify advice for your specific product, city, and destination country.',
    originNote: 'Sharing is optional. Your profile stays private until you choose what to share.',
    cities: ['Your campus', '1688 search', 'Supplier chat', 'Your destination'],
    shippingKicker: 'Before anything leaves China', shippingTitle: 'Shipping is a conversation, not a button.', shippingIntro: 'Routes, rules, costs, and timelines change. Get a written quote for your exact goods and destination before you commit.',
    shipping1Title: 'Ask for a complete quote', shipping1Body: 'The cheapest unit price is not the landed cost. Ask what is included, what is not, and who handles each step.',
    shipping1List: ['Product and sample cost, plus packing details', 'Shipping method, destination, and estimated transit window', 'Customs, duties, insurance, and destination fees—who pays?'],
    shipping2Title: 'Choose the route that fits', shipping2Body: 'Compare options using your actual shipment details. These are route types, not recommendations or company endorsements.',
    shipping2List: ['Express courier: often suited to smaller, time-sensitive parcels', 'Air freight: compare chargeable weight and airport handling', 'Sea freight: consider volume, port handling, and a longer transit window'],
    shippingDisclaimer: 'Illustrative guidance only. No carrier, price, delivery time, or customs outcome is guaranteed.',
    ctaTitle: 'Make your next supplier chat a better one.', ctaText: 'Keep the guide close and build your first product brief, one question at a time.', ctaButton: 'Start with a product search',
    footerLine: 'A practical field guide for students sourcing in China.', footerNote: 'Independent resource · Examples are illustrative, not verified listings.',
    footerPrivacy: 'Profile details stay private unless you choose to share them.',
    joinTitle: 'Your student sourcing profile', joinIntro: 'Sign in to save your profile to your account. Sharing it with other students is optional.', nameLabel: 'Full name', namePlaceholder: 'Your full name', originLabel: 'Country / city of origin', originPlaceholder: 'Country and city', universityLabel: 'University', universityPlaceholder: 'Your university', chinaCityLabel: 'City in China', chinaCityPlaceholder: 'Where you study in China', interestLabel: 'Sourcing interests', interestPlaceholder: 'Separate interests with commas or new lines', contactLabel: 'Contact (optional)', contactPlaceholder: 'Email or preferred contact', submit: 'Save profile',
    communityTitle: 'Student sourcing community', communityIntro: 'Meet students who have chosen to share their sourcing profile. Only signed-in students can view this directory.', communitySignIn: 'Sign in or create an account to view shared student profiles.', communityLoading: 'Loading shared profiles…', communityEmptyTitle: 'No shared profiles yet', communityEmptyBody: 'Profiles appear here only after students opt in. Your profile stays private until you turn on sharing.', communityContactLabel: 'Contact',
    accountLoading: 'Checking your account…', signIn: 'Sign in', signUp: 'Create account', profileLoading: 'Loading your saved profile…', profileLoadError: 'Your saved profile could not be loaded. Try again.', profileSaveError: 'Your profile could not be saved. Please try again.', profileSaving: 'Saving…',
    privacyTitle: 'Choose what other students can see', privacyCopy: 'Your information is stored with your account. Nothing is listed in the community unless you turn on profile sharing.',
    shareProfileLabel: 'Share my profile with students', shareProfileDetail: 'Shares your name, origin, university, city in China, and sourcing interests with signed-in students.',
    shareContactLabel: 'Also share my contact', shareContactDetail: 'Contact is private unless you check this separately. You can leave it blank or keep it private.',
    successTitle: 'Profile saved', successPrivate: 'Your profile is saved to your account and is private to you.', successShared: 'Your profile is now visible to signed-in students in the community directory.', successContactPrivate: 'Your contact details remain private.', successContactShared: 'You chose to share your contact with signed-in students.', done: 'Done',
    searchEmpty: 'Add a product name first so 1688 can search for it.', interestLimit: 'Use 1–8 interests, each no longer than 80 characters.', signOut: 'Sign out', menu: 'Open navigation', close: 'Close'
  },
  ar: {
    navHome: 'الرئيسية', navCourses: 'الدورات', navGuides: 'الأدلة', navContact: 'تواصل', navCommunity: 'المجتمع', navHow: 'كيف تبدأ', navWhy: 'لماذا هذا الدليل', navShipping: 'أساسيات الشحن', join: 'انضم',
    bannerOneTitle: 'تعلّم الاستيراد من الصين', bannerOneSub: 'دليل خطوة بخطوة للطلبة الجدد: ابحث عن الموردين، فاوض، واشحن بأمان', bannerOneButton: 'ابدأ الآن',
    bannerTwoTitle: 'دورات الاستيراد للطلبة', bannerTwoSub: 'دروس عملية باللغتين العربية والإنجليزية', bannerTwoButton: 'تصفح الدورات',
    productImageAlt: 'عينات منتجات وصندوق شحن على منصة داكنة', courseImageAlt: 'حاسوب محمول وهاتف يعرضان خريطة مضيئة للصين على منصة داكنة', mainNavLabel: 'التنقل الرئيسي', footerNavLabel: 'تنقل التذييل', bannersLabel: 'مقدمات للطلاب حول الاستيراد',
    courseKicker: 'تعلّم بالوتيرة التي تناسبك', courseTitle: 'دورات الاستيراد للطلبة', courseIntro: 'مساحة تعليمية مبسطة للمهارات اللازمة لأول طلب.', courseCardTitle: 'ابدأ بأساسيات الاستيراد', courseCardBody: 'يجري إعداد مخطط الدورة. لا يوجد كتالوج دورات أو خدمة تسجيل مرتبطة بهذا النموذج التجريبي.', courseLabel: 'معاينة دورة · قريباً',
    directoryTitle: 'دليل جهات اتصال الشحن', directoryEmpty: 'لم تُقدَّم بعد بيانات تواصل لشركاء شحن تم التحقق منهم.', directoryNote: 'لن ندرج شركة نقل أو جهة اتصال قبل التحقق المستقل من تفاصيلها. اطلب من الموردين خيارات شحن مكتوبة وقارنها وفق وجهتك.',
    eyebrow: 'دليل التوريد الأول للطلاب',
    headlineA: 'اعثر على أول', headlineAccent: 'مصنع لك في الصين.', heroSub: 'طريقة أوضح للانتقال من «أحتاج هذا المنتج» إلى محادثة مورد تفهمها. دليل للطلاب الذين يبدأون رحلتهم ويبحثون عن أول منتج.',
    ctaSearch: 'ابحث في 1688', ctaGuide: 'استكشف الدليل', note: 'دليل مستقل · لا علاقة تجارية بالموردين',
    searchPlaceholder: 'ما المنتج الذي تبحث عنه؟', searchLabel: 'ابحث عن المنتجات في 1688', sourceHint: 'سيُفتح موقع 1688 في علامة تبويب جديدة. نتائج البحث ليست توصيات.',
    tagProduct: 'فكرة المنتج', tagFactory: 'أسئلة للمصنع', tagShipment: 'خيارات الشحن',
    trust1: 'ابدأ بوصف واضح للمنتج', trust2: 'اسأل المورد أسئلة أفضل', trust3: 'قارن الشحن قبل الدفع',
    howKicker: 'بداية عملية', howTitle: 'من الفضول إلى أول طلب بثقة.', howIntro: 'لا توجد اختصارات سحرية. اتبع خطوات مفيدة لفهم السوق والتحقق مما تستطيع وطرح الأسئلة المناسبة.',
    steps: [
      ['01', 'حدّد ما تحتاجه', 'اكتب المنتج والكمية والخامة والمتطلبات الأساسية. الوصف الواضح يساعدك في الحصول على إجابات أوضح.'],
      ['02', 'ابحث أبعد من الصورة', 'جرّب كلمات المنتج في 1688. قارن القوائم والمواصفات والحد الأدنى للطلب وتفاصيل البائع.'],
      ['03', 'اسأل ثم تحقّق', 'اطلب عرض سعر حديثاً وبيانات النشاط التجاري. المحادثة أو صفحة المنتج لا تثبت أن البائع مصنع.'],
      ['04', 'خطط للرحلة', 'أكد العينات وشروط الدفع والتغليف والوجهة وتكاليف الشحن قبل تقديم الطلب.']
    ],
    whyKicker: 'مصمم لتجربتك الأولى', whyTitle: 'تخمين أقل. أسئلة مفيدة أكثر.', whyBody: 'أنت جديد في الصين، ولست جديداً على التفكير الجيد. يحوّل هذا الدليل عملية التوريد غير المألوفة إلى خطوات قابلة للتنفيذ، دون ادعاء أن كل مورد موثوق أو أن كل شحنة سهلة.',
    whyTags: ['إرشادات بلغة واضحة', 'أسئلة للتحقق من المصنع', 'دون ترتيب مدفوع للموردين', 'مراعاة تجربة الطالب'],
    originKicker: 'بدايتك تصنع الفرق', originTitle: 'وجودك كطالب في الصين يقرّبك من المصدر.', originP1: 'سواء وصلت من القاهرة أو عمّان أو لاغوس أو جاكرتا أو من مكان آخر، يمكنك تعلّم الأساسيات على مهل. ابدأ صغيراً: افهم المنتج، واطلب أدلة، واحتفظ بالتفاصيل المهمة مكتوبة.', originP2: 'استفد من شبكة جامعتك والدعم المحلي عند الحاجة، لكن تحقّق من ملاءمة النصيحة لمنتجك ومدينتك وبلد وجهتك.',
    originNote: 'المشاركة اختيارية. يظل ملفك خاصاً إلى أن تختار ما تريد مشاركته.',
    cities: ['جامعتك', 'بحث 1688', 'محادثة المورد', 'وجهتك'],
    shippingKicker: 'قبل مغادرة الشحنة للصين', shippingTitle: 'الشحن حوار، وليس زرّاً.', shippingIntro: 'تتغير الطرق والقواعد والتكاليف والمواعيد. اطلب عرضاً مكتوباً لبضاعتك ووجهتك تحديداً قبل الالتزام.',
    shipping1Title: 'اطلب عرضاً شاملاً', shipping1Body: 'أقل سعر للقطعة لا يعني أقل تكلفة وصول. اسأل عمّا يشمله السعر وما لا يشمله ومن يتولى كل خطوة.',
    shipping1List: ['تكلفة المنتج والعينة وتفاصيل التغليف', 'طريقة الشحن والوجهة والمدة التقديرية للنقل', 'من يدفع الجمارك والرسوم والتأمين ورسوم الوجهة؟'],
    shipping2Title: 'اختر المسار المناسب', shipping2Body: 'قارن الخيارات وفق تفاصيل شحنتك الفعلية. هذه أنواع مسارات وليست توصيات أو تزكية لشركات.',
    shipping2List: ['البريد السريع: قد يناسب الطرود الصغيرة المستعجلة', 'الشحن الجوي: قارن الوزن الحجمي ورسوم المناولة بالمطار', 'الشحن البحري: ضع في الحسبان الحجم ومناولة الميناء والمدة الأطول'],
    shippingDisclaimer: 'معلومات توضيحية فقط. لا ضمان لشركة ناقلة أو سعر أو موعد تسليم أو نتيجة جمركية.',
    ctaTitle: 'اجعل محادثتك القادمة مع المورد أفضل.', ctaText: 'احتفظ بالدليل قريباً وأنشئ وصف منتجك الأول، سؤالاً في كل مرة.', ctaButton: 'ابدأ بالبحث عن منتج',
    footerLine: 'دليل عملي للطلاب الراغبين في التوريد من الصين.', footerNote: 'مصدر مستقل · الأمثلة توضيحية وليست قوائم تم التحقق منها.',
    footerPrivacy: 'تظل تفاصيل الملف خاصة ما لم تختر مشاركتها.',
    joinTitle: 'ملفك الشخصي للاستيراد', joinIntro: 'سجّل الدخول لحفظ ملفك في حسابك. مشاركة الملف مع الطلاب الآخرين اختيارية.', nameLabel: 'الاسم الكامل', namePlaceholder: 'اسمك الكامل', originLabel: 'بلد / مدينة المنشأ', originPlaceholder: 'البلد والمدينة', universityLabel: 'الجامعة', universityPlaceholder: 'اسم الجامعة', chinaCityLabel: 'المدينة في الصين', chinaCityPlaceholder: 'مدينة دراستك في الصين', interestLabel: 'اهتمامات التوريد', interestPlaceholder: 'افصل الاهتمامات بفواصل أو أسطر جديدة', contactLabel: 'وسيلة تواصل (اختياري)', contactPlaceholder: 'البريد الإلكتروني أو وسيلة التواصل المفضلة', submit: 'حفظ الملف الشخصي',
    communityTitle: 'مجتمع التوريد الطلابي', communityIntro: 'تعرّف على الطلاب الذين اختاروا مشاركة ملفاتهم. لا يمكن عرض الدليل إلا بعد تسجيل الدخول.', communitySignIn: 'سجّل الدخول أو أنشئ حساباً لعرض ملفات الطلاب المشتركة.', communityLoading: 'جارٍ تحميل الملفات المشتركة…', communityEmptyTitle: 'لا توجد ملفات مشتركة بعد', communityEmptyBody: 'تظهر الملفات هنا بعد موافقة أصحابها. يظل ملفك خاصاً حتى تفعّل المشاركة.', communityContactLabel: 'التواصل',
    accountLoading: 'جارٍ التحقق من حسابك…', signIn: 'تسجيل الدخول', signUp: 'إنشاء حساب', profileLoading: 'جارٍ تحميل ملفك المحفوظ…', profileLoadError: 'تعذّر تحميل ملفك المحفوظ. حاول مرة أخرى.', profileSaveError: 'تعذّر حفظ ملفك. حاول مرة أخرى.', profileSaving: 'جارٍ الحفظ…',
    privacyTitle: 'اختر ما يمكن للطلاب الآخرين رؤيته', privacyCopy: 'تُحفظ معلوماتك مع حسابك. لن يظهر شيء في المجتمع ما لم تفعّل مشاركة الملف.',
    shareProfileLabel: 'مشاركة ملفي مع الطلاب', shareProfileDetail: 'يشمل اسمك ومنشأك وجامعتك ومدينتك في الصين واهتمامات التوريد، ويظهر للطلاب المسجلين فقط.',
    shareContactLabel: 'مشاركة وسيلة التواصل أيضاً', shareContactDetail: 'تظل وسيلة التواصل خاصة ما لم تحدد هذا الخيار بشكل منفصل. يمكنك تركها فارغة أو إبقاءها خاصة.',
    successTitle: 'تم حفظ الملف الشخصي', successPrivate: 'حُفظ ملفك في حسابك وهو خاص بك فقط.', successShared: 'أصبح ملفك ظاهراً للطلاب المسجلين في دليل المجتمع.', successContactPrivate: 'تظل وسيلة التواصل خاصة.', successContactShared: 'اخترت مشاركة وسيلة التواصل مع الطلاب المسجلين.', done: 'تم',
    searchEmpty: 'أدخل اسم المنتج أولاً ليبحث عنه 1688.', interestLimit: 'أدخل من اهتمام واحد إلى 8 اهتمامات، بحد أقصى 80 حرفاً لكل منها.', signOut: 'تسجيل الخروج', menu: 'افتح القائمة', close: 'إغلاق'
  }
} as const;

function StudentLanding() {
  const [language, setLanguage] = useState<Language>('en');
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [product, setProduct] = useState('');
  const [toast, setToast] = useState('');
  const [profileForm, setProfileForm] = useState<ProfileDraft>(emptyProfileDraft);
  const [savedProfile, setSavedProfile] = useState<StudentProfile | null>(null);
  const joinTriggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const profileQuery = useGetMyStudentProfile({
    query: { enabled: joinOpen && Boolean(isSignedIn) },
  });
  const communityQuery = useListCommunityStudentProfiles({
    query: { enabled: Boolean(isSignedIn) },
  });
  const saveProfile = useSaveMyStudentProfile({
    mutation: {
      onSuccess: async (profile) => {
        setSavedProfile(profile);
        setSubmitted(true);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetMyStudentProfileQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getListCommunityStudentProfilesQueryKey() }),
        ]);
      },
    },
  });
  const t = copy[language];
  const rtl = language === 'ar';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }, [language, rtl]);

  useEffect(() => {
    if (!joinOpen) setSubmitted(false);
  }, [joinOpen]);

  useEffect(() => {
    if (
      !joinOpen ||
      !isSignedIn ||
      profileQuery.isLoading ||
      profileQuery.isFetching ||
      profileQuery.isError ||
      !profileQuery.data
    ) {
      return;
    }
    const profile = profileQuery.data.profile;
    setProfileForm(profile ? {
      fullName: profile.fullName,
      origin: profile.origin,
      university: profile.university,
      chinaCity: profile.chinaCity,
      interestsText: profile.interests.join(', '),
      contact: profile.contact ?? '',
      shareWithCommunity: profile.shareWithCommunity,
      shareContact: profile.shareContact,
    } : emptyProfileDraft);
  }, [
    joinOpen,
    isSignedIn,
    profileQuery.data,
    profileQuery.isError,
    profileQuery.isFetching,
    profileQuery.isLoading,
  ]);

  useEffect(() => {
    if (!joinOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])') ?? []);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setJoinOpen(false);
        return;
      }
      if (event.key === 'Tab') {
        const items = focusable();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    focusable()[0]?.focus();
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [joinOpen]);

  function openSearch() {
    if (!product.trim()) {
      setToast(t.searchEmpty);
      window.setTimeout(() => setToast(''), 2600);
      return;
    }
    const url = `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(product.trim())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const interests = profileForm.interestsText
      .split(/[,\n]/)
      .map((interest) => interest.trim())
      .filter(Boolean);
    if (interests.length === 0 || interests.length > 8 || interests.some((interest) => interest.length > 80)) {
      setToast(t.interestLimit);
      window.setTimeout(() => setToast(''), 2600);
      return;
    }
    saveProfile.mutate({
      data: {
        fullName: profileForm.fullName.trim(),
        origin: profileForm.origin.trim(),
        university: profileForm.university.trim(),
        chinaCity: profileForm.chinaCity.trim(),
        interests,
        contact: profileForm.contact.trim() || null,
        shareWithCommunity: profileForm.shareWithCommunity,
        shareContact: profileForm.shareContact,
      },
    });
  }

  const closeMenu = () => setMenuOpen(false);
  const openJoin = () => { saveProfile.reset(); setSavedProfile(null); setJoinOpen(true); closeMenu(); };
  const scrollTo = (id: string) => { closeMenu(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <div className="site-shell" dir={rtl ? 'rtl' : 'ltr'}>
      <header className="topbar">
        <div className="wrap nav-inner">
          <a className="brand" href="#home" aria-label="Source, Student home" data-testid="brand-home">
            <span className="brand-mark"><Compass aria-hidden="true" /></span>
            <span>source<span style={{ color: '#71e6d7' }}>,</span> student</span>
          </a>
          <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label={t.mainNavLabel}>
            <a href="#home" onClick={closeMenu} data-testid="nav-home">{t.navHome}</a>
            <a href="#course-list" onClick={closeMenu} data-testid="nav-courses">{t.navCourses}</a>
            <a href="#how" onClick={closeMenu} data-testid="nav-guides">{t.navGuides}</a>
            <a href="#community" onClick={closeMenu} data-testid="nav-community">{t.navCommunity}</a>
            <a href="#contact" onClick={closeMenu} data-testid="nav-contact">{t.navContact}</a>
          </nav>
          <div className="nav-actions">
            <button className="lang-button" onClick={() => setLanguage(rtl ? 'en' : 'ar')} aria-label={rtl ? 'Switch language to English' : 'تغيير اللغة إلى العربية'} data-testid="language-switch">
              <Languages size={14} /> {rtl ? 'EN' : 'AR'}
            </button>
            <button ref={joinTriggerRef} className="button button-primary" onClick={openJoin} data-testid="join-button">{t.join}</button>
            <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? t.close : t.menu} aria-expanded={menuOpen} data-testid="mobile-menu-toggle">
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </header>

      <main id="home">
        <section className="banner-stack wrap" aria-label={t.bannersLabel}>
          <article className="promo-banner learn-banner reveal">
            <div className="promo-visual">
              <div className="promo-horizon" />
              <img src="/source-still-life.png" alt={t.productImageAlt} />
              <span className="visual-caption">FIELD NOTE / 01</span>
            </div>
            <div className="promo-copy">
              <div className="eyebrow">{t.eyebrow}</div>
              <h1>{t.bannerOneTitle}</h1>
              <p>{t.bannerOneSub}</p>
              <a className="button button-primary" href="#how" data-testid="start-now-link">{t.bannerOneButton}<ArrowUpRight /></a>
            </div>
            <div className="swoosh teal-swoosh" aria-hidden="true" />
          </article>
          <article className="promo-banner courses-banner reveal" id="course-intro">
            <div className="promo-copy">
              <div className="eyebrow purple-eyebrow">{t.courseKicker}</div>
              <h2>{t.bannerTwoTitle}</h2>
              <p>{t.bannerTwoSub}</p>
              <a className="button button-primary" href="#course-list" data-testid="browse-courses-link">{t.bannerTwoButton}<ArrowUpRight /></a>
            </div>
            <div className="promo-visual">
              <div className="promo-horizon" />
              <img src="/course-learning-still-life.png" alt={t.courseImageAlt} />
              <span className="visual-caption">LEARNING / 02</span>
            </div>
            <div className="swoosh violet-swoosh" aria-hidden="true" />
          </article>
        </section>

        <div className="trustline">
          <div className="wrap trust-inner">
            <span className="trust-item"><Check />{t.trust1}</span>
            <span className="trust-item"><MessageCircle />{t.trust2}</span>
            <span className="trust-item"><PackageCheck />{t.trust3}</span>
          </div>
        </div>

        <section id="how" className="section">
          <div className="wrap">
            <div className="section-head">
              <div><div className="section-kicker">{t.howKicker}</div><h2>{t.howTitle}</h2></div>
              <p className="section-intro">{t.howIntro}</p>
            </div>
            <div className="steps-grid">
              {t.steps.map(([num, title, body], i) => {
                const icons = [<Sparkles key="spark" />, <Search key="search" />, <ShieldCheck key="shield" />, <Box key="box" />];
                return <article className="step-card" key={num}>
                  <span className="step-number">{num} / 04</span>
                  <div className="step-icon">{icons[i]}</div>
                  <h3>{title}</h3><p>{body}</p>
                </article>;
              })}
            </div>
            <div className="guide-search">
              <div><span className="section-kicker">{t.tagProduct}</span><p>{t.note}</p></div>
              <div className="guide-search-controls">
                <label className="sr-only" htmlFor="product-search">{t.searchLabel}</label>
                <input id="product-search" className="field-input" value={product} onChange={(e) => setProduct(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') openSearch(); }} placeholder={t.searchPlaceholder} data-testid="product-search-input" />
                <button className="button button-primary" onClick={openSearch} data-testid="search-1688-button"><Search size={15} />{t.ctaSearch}<ArrowUpRight size={15} /></button>
              </div>
              <p className="guide-search-note">{t.sourceHint}</p>
            </div>
          </div>
        </section>

        <section id="course-list" className="section course-section">
          <div className="wrap">
            <div className="section-head">
              <div><div className="section-kicker">{t.courseKicker}</div><h2>{t.courseTitle}</h2></div>
              <p className="section-intro">{t.courseIntro}</p>
            </div>
            <article className="course-placeholder">
              <span className="course-status"><Sparkles size={14} />{t.courseLabel}</span>
              <div><h3>{t.courseCardTitle}</h3><p>{t.courseCardBody}</p></div>
              <div className="course-outline" aria-hidden="true"><span>01</span><span>02</span><span>03</span><span>04</span></div>
            </article>
          </div>
        </section>

        <section id="why" className="wrap">
          <div className="why-band">
            <div className="why-content">
              <div className="section-kicker">{t.whyKicker}</div>
              <h2>{t.whyTitle}</h2>
              <p>{t.whyBody}</p>
              <div className="why-tags">{t.whyTags.map((tag) => <span className="pill" key={tag}>{tag}</span>)}</div>
            </div>
          </div>
        </section>

        <section className="section origin-section">
          <div className="wrap origin-layout">
            <div className="origin-visual" aria-hidden="true">
              <span className="origin-node n1">{t.cities[0]}</span><span className="origin-node n2">{t.cities[1]}</span>
              <span className="origin-node n3">{t.cities[2]}</span><span className="origin-node n4">{t.cities[3]}</span>
              <div className="origin-core"><Globe2 /></div>
            </div>
            <div className="origin-copy">
              <div className="section-kicker">{t.originKicker}</div>
              <h2>{t.originTitle}</h2>
              <p>{t.originP1}</p><p>{t.originP2}</p>
              <div className="profile-note"><Users size={15} style={{ verticalAlign: 'middle', marginInlineEnd: 7, color: '#a89af8' }} />{t.originNote}</div>
            </div>
          </div>
        </section>

        <section id="community" className="section community-section" data-testid="student-community">
          <div className="wrap">
            <div className="section-head">
              <div><div className="section-kicker">{t.navCommunity}</div><h2>{t.communityTitle}</h2></div>
              <p className="section-intro">{t.communityIntro}</p>
            </div>
            {!isLoaded ? <p className="community-status" role="status">{t.accountLoading}</p>
              : !isSignedIn ? <div className="community-gate">
                <p>{t.communitySignIn}</p>
                <button className="button button-primary" onClick={openJoin}>{t.join}<ArrowUpRight /></button>
              </div>
              : communityQuery.isLoading ? <p className="community-status" role="status">{t.communityLoading}</p>
                : communityQuery.isError ? <div className="community-gate" role="alert">
                  <p>{t.profileLoadError}</p>
                  <button className="button button-quiet" onClick={() => communityQuery.refetch()}>{rtl ? 'إعادة المحاولة' : 'Try again'}</button>
                </div>
                : communityQuery.data?.profiles.length ? <div className="community-grid">
                  {communityQuery.data.profiles.map((profile) => <article className="community-card" key={profile.id} data-testid="student-profile-card">
                    <div className="community-card-top">
                      <div className="community-avatar" aria-hidden="true">{profile.fullName.trim().charAt(0).toLocaleUpperCase()}</div>
                      <div><h3>{profile.fullName}</h3><p>{profile.university}</p></div>
                    </div>
                    <dl className="community-details">
                      <div><dt>{t.originLabel}</dt><dd>{profile.origin}</dd></div>
                      <div><dt>{t.chinaCityLabel}</dt><dd>{profile.chinaCity}</dd></div>
                    </dl>
                    <div className="community-interests" aria-label={t.interestLabel}>
                      {profile.interests.map((interest) => <span className="pill" key={interest}>{interest}</span>)}
                    </div>
                    {profile.contact && <p className="community-contact"><MessageCircle size={14} /> <span>{t.communityContactLabel}: {profile.contact}</span></p>}
                  </article>)}
                </div>
                : <div className="community-gate community-empty">
                  <div className="success-icon"><Users /></div><h3>{t.communityEmptyTitle}</h3><p>{t.communityEmptyBody}</p>
                  <button className="button button-quiet" onClick={openJoin}>{t.join}</button>
                </div>}
            <div className="community-privacy-note"><ShieldCheck size={15} />{t.originNote}</div>
          </div>
        </section>

        <section id="shipping" className="section ship-section">
          <div className="wrap">
            <div className="section-head">
              <div><div className="section-kicker">{t.shippingKicker}</div><h2>{t.shippingTitle}</h2></div>
              <p className="section-intro">{t.shippingIntro}</p>
            </div>
            <div className="ship-layout">
              <article className="ship-card">
                <div className="ship-head"><h3>{t.shipping1Title}</h3><span className="ship-icon"><CircleHelp /></span></div>
                <p>{t.shipping1Body}</p>
                <ul className="ship-list">{t.shipping1List.map((line) => <li key={line}><Check />{line}</li>)}</ul>
              </article>
              <article className="ship-card feature">
                <div className="ship-head"><h3>{t.shipping2Title}</h3><span className="ship-icon"><Ship /></span></div>
                <p>{t.shipping2Body}</p>
                <ul className="ship-list">{t.shipping2List.map((line) => <li key={line}><ArrowRight />{line}</li>)}</ul>
              </article>
            </div>
            <p className="disclaimer"><BadgeCheck size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 6 }} />{t.shippingDisclaimer}</p>
            <article className="directory-panel" id="contact">
              <div className="directory-mark"><Ship size={20} /></div>
              <div><div className="section-kicker">{t.directoryTitle}</div><h3>{t.directoryEmpty}</h3><p>{t.directoryNote}</p></div>
              <span className="directory-status"><span />{rtl ? 'لا توجد جهات مُدرجة' : 'No listings yet'}</span>
            </article>
          </div>
        </section>

        <section className="wrap">
          <div className="guide-cta">
            <div><h2>{t.ctaTitle}</h2><p>{t.ctaText}</p></div>
            <button className="button button-primary" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t.ctaButton}<ArrowUpRight /></button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <div>
          <a className="brand" href="#home" data-testid="footer-home"><span className="brand-mark"><Compass /></span><span>source<span style={{ color: '#71e6d7' }}>,</span> student</span></a>
            <p className="footer-copy">{t.footerLine}<br />{t.footerNote}<br />{t.footerPrivacy}</p>
          </div>
          <nav className="footer-nav" aria-label={t.footerNavLabel}>
            <a href="#course-list" data-testid="footer-courses">{t.navCourses}</a><a href="#how" data-testid="footer-guides">{t.navGuides}</a><a href="#community" data-testid="footer-community">{t.navCommunity}</a><a href="#contact" data-testid="footer-contact">{t.navContact}</a>
            <button onClick={() => setLanguage(rtl ? 'en' : 'ar')} style={{ border: 0, padding: 0, background: 'none', color: '#9d9ba8', fontSize: 10, cursor: 'pointer' }} data-testid="footer-language-switch">{rtl ? 'EN' : 'AR'}</button>
          </nav>
        </div>
      </footer>

      {joinOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setJoinOpen(false); }}>
        <section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="join-title">
          <button className="modal-close" onClick={() => setJoinOpen(false)} aria-label={t.close} data-testid="join-close"><X size={17} /></button>
          {isSignedIn && <button className="sign-out-button" onClick={() => void signOut({ redirectUrl: basePath || '/' })} data-testid="profile-sign-out">{t.signOut}</button>}
          <div className="eyebrow">{t.eyebrow}</div>
          <h2 id="join-title">{t.joinTitle}</h2>
          {!isLoaded ? <p role="status">{t.accountLoading}</p>
            : !isSignedIn ? <div className="auth-required">
              <p>{t.joinIntro}</p>
              <div className="auth-choice">
                <a className="button button-primary" href={`${basePath}/sign-in`} data-testid="profile-sign-in">{t.signIn}</a>
                <a className="button button-quiet" href={`${basePath}/sign-up`} data-testid="profile-sign-up">{t.signUp}</a>
              </div>
            </div>
            : profileQuery.isLoading || profileQuery.isFetching ? <p role="status">{t.profileLoading}</p>
              : profileQuery.isError ? <div className="community-gate" role="alert">
                <p>{t.profileLoadError}</p>
                <button className="button button-quiet" onClick={() => profileQuery.refetch()}>{rtl ? 'إعادة المحاولة' : 'Try again'}</button>
              </div>
                : !submitted ? <>
                  <p>{t.joinIntro}</p>
                  <form onSubmit={submitProfile}>
                    <label className="field-label" htmlFor="join-name">{t.nameLabel}</label>
                    <input id="join-name" name="fullName" className="field-input" maxLength={120} placeholder={t.namePlaceholder} value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} required autoFocus data-testid="profile-full-name" />
                    <label className="field-label" htmlFor="join-origin">{t.originLabel}</label>
                    <input id="join-origin" name="origin" className="field-input" maxLength={120} placeholder={t.originPlaceholder} value={profileForm.origin} onChange={(e) => setProfileForm({ ...profileForm, origin: e.target.value })} required data-testid="profile-origin" />
                    <label className="field-label" htmlFor="join-university">{t.universityLabel}</label>
                    <input id="join-university" name="university" className="field-input" maxLength={180} placeholder={t.universityPlaceholder} value={profileForm.university} onChange={(e) => setProfileForm({ ...profileForm, university: e.target.value })} required data-testid="profile-university" />
                    <label className="field-label" htmlFor="join-china-city">{t.chinaCityLabel}</label>
                    <input id="join-china-city" name="chinaCity" className="field-input" maxLength={100} placeholder={t.chinaCityPlaceholder} value={profileForm.chinaCity} onChange={(e) => setProfileForm({ ...profileForm, chinaCity: e.target.value })} required data-testid="profile-china-city" />
                    <label className="field-label" htmlFor="join-interest">{t.interestLabel}</label>
                    <textarea id="join-interest" name="interests" className="field-input profile-interests" maxLength={700} placeholder={t.interestPlaceholder} value={profileForm.interestsText} onChange={(e) => setProfileForm({ ...profileForm, interestsText: e.target.value })} required data-testid="profile-interest" />
                    <label className="field-label" htmlFor="join-contact">{t.contactLabel}</label>
                    <input id="join-contact" name="contact" className="field-input" maxLength={180} placeholder={t.contactPlaceholder} value={profileForm.contact} onChange={(e) => setProfileForm({ ...profileForm, contact: e.target.value, shareContact: e.target.value.trim() ? profileForm.shareContact : false })} data-testid="profile-contact" />

                    <div className="consent-heading"><ShieldCheck size={16} /><div><strong>{t.privacyTitle}</strong><p>{t.privacyCopy}</p></div></div>
                    <label className="consent-option">
                      <input className="consent-checkbox" type="checkbox" checked={profileForm.shareWithCommunity} onChange={(e) => setProfileForm({ ...profileForm, shareWithCommunity: e.target.checked, shareContact: e.target.checked ? profileForm.shareContact : false })} data-testid="profile-share-community" />
                      <span><strong>{t.shareProfileLabel}</strong><small>{t.shareProfileDetail}</small></span>
                    </label>
                    <label className={`consent-option ${!profileForm.shareWithCommunity || !profileForm.contact.trim() ? 'disabled' : ''}`}>
                      <input className="consent-checkbox" type="checkbox" checked={profileForm.shareContact} disabled={!profileForm.shareWithCommunity || !profileForm.contact.trim()} onChange={(e) => setProfileForm({ ...profileForm, shareContact: e.target.checked })} data-testid="profile-share-contact" />
                      <span><strong>{t.shareContactLabel}</strong><small>{t.shareContactDetail}</small></span>
                    </label>
                    {saveProfile.isError && <p className="form-error" role="alert">{t.profileSaveError}</p>}
                    <button className="button button-primary modal-submit" type="submit" disabled={saveProfile.isPending} data-testid="profile-preview-submit">
                      {saveProfile.isPending ? t.profileSaving : t.submit}<ArrowLeft />
                    </button>
                  </form>
                </> : <div className="success-state">
                  <div className="success-icon"><Check /></div><h2>{t.successTitle}</h2>
                  <p>{savedProfile?.shareWithCommunity ? t.successShared : t.successPrivate}</p>
                  <p>{savedProfile?.shareContact ? t.successContactShared : t.successContactPrivate}</p>
                  <button className="button button-primary" onClick={() => setJoinOpen(false)} data-testid="profile-preview-close">{t.done}</button>
                </div>}
        </section>
      </div>}
      {toast && <div className="toast-note" role="status">{toast}</div>}
    </div>
  );
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in the app environment.');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#66e6d6',
    colorForeground: '#e8e8ef',
    colorMutedForeground: '#a6a4b1',
    colorDanger: '#f87171',
    colorBackground: '#181820',
    colorInput: '#111116',
    colorInputForeground: '#eeedf4',
    colorNeutral: '#e8e8ef',
    fontFamily: 'Manrope, Noto Sans Arabic, sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#181820] rounded-2xl w-[440px] max-w-full overflow-hidden border border-white/10',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#f1eff8]',
    headerSubtitle: 'text-[#a6a4b1]',
    socialButtonsBlockButtonText: 'text-[#e8e8ef]',
    formFieldLabel: 'text-[#cbc8d5]',
    footerActionLink: 'text-[#71e6d7]',
    footerActionText: 'text-[#a6a4b1]',
    dividerText: 'text-[#a6a4b1]',
    identityPreviewEditButton: 'text-[#71e6d7]',
    formFieldSuccessText: 'text-[#71e6d7]',
    alertText: 'text-red-200',
    logoBox: 'flex justify-center',
    logoImage: 'max-w-[180px]',
    socialButtonsBlockButton: 'border border-white/10 bg-white/[0.03] hover:bg-white/[0.08]',
    formButtonPrimary: 'bg-[#66e6d6] text-[#10201f] hover:bg-[#8af2e5]',
    formFieldInput: 'bg-[#111116] text-[#eeedf4] border border-white/15',
    footerAction: 'border-t border-white/10',
    dividerLine: 'bg-white/10',
    alert: 'bg-red-950/30',
    otpCodeFieldInput: 'bg-[#111116] text-[#eeedf4]',
    formFieldRow: 'gap-2',
    main: 'text-[#e8e8ef]',
  },
};

function SignInPage() {
  return (
    <div className="clerk-page">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="clerk-page">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const scopedQueryClient = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) {
        scopedQueryClient.clear();
      }
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, scopedQueryClient]);

  return null;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <div className="auth-page-loading" role="status">Loading account…</div>;
  return isSignedIn ? <Redirect to="/community" /> : <StudentLanding />;
}

function CommunityPortal() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <div className="auth-page-loading" role="status">Loading account…</div>;
  return isSignedIn ? <StudentLanding /> : <Redirect to="/" />;
}

function AppRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to access your student account.' } },
        signUp: { start: { title: 'Join the student community', subtitle: 'Create an account to save your sourcing profile.' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/community" component={CommunityPortal} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}

export default App;
