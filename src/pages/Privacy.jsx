import LegalPage, { LegalLink } from "../components/LegalPage.jsx";
import { COMPANY, CONTACT_EMAIL, LAST_UPDATED } from "./LegalInfo.jsx";

/* Template only, not legal advice. Check every statement below against what your
   app and backend really do, then have a lawyer review it before you publish. */

const Mail = () => (
    <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 underline underline-offset-2">
        {CONTACT_EMAIL}
    </a>
);

const SECTIONS = [
    {
        id: "who-we-are",
        title: "Who we are",
        blocks: [
            {
                type: "p",
                content: (
                    <>
                        {COMPANY} runs a service that helps diners find and book restaurants, and helps restaurant owners manage
                        their listings and bookings (the "Service"). This policy explains what personal information we collect,
                        why, and the choices you have. It applies alongside our <LegalLink to="/terms">Terms and Conditions</LegalLink>.
                    </>
                ),
            },
            {
                type: "p",
                content: (
                    <>
                        For anything in this policy, you can reach us at <Mail />.
                    </>
                ),
            },
        ],
    },
    {
        id: "what-we-collect",
        title: "Information we collect",
        blocks: [
            { type: "p", content: "The information we collect depends on how you use the Service." },
            {
                type: "ul",
                items: [
                    "Account details: your name, email address, password and whether you joined as a diner or a restaurant owner.",
                    "Booking details: the restaurant, date and time, party size and any notes you add.",
                    "Restaurant details, for owners: the restaurant's name, address, hours, menus, prices and photos.",
                    "Content you post: reviews, ratings, photos and messages.",
                    "Technical information: your IP address, browser and device type, pages viewed and when, and error logs.",
                    "Cookies and similar technologies, described in the section on cookies below.",
                ],
            },
            {
                type: "p",
                content:
                    "We don't need, and don't ask for, sensitive details such as your health or religion. If you add allergy or dietary notes to a booking, that information goes to the restaurant so they can look after you.",
            },
        ],
    },
    {
        id: "how-we-use",
        title: "How we use your information",
        blocks: [
            {
                type: "ul",
                items: [
                    "To create and run your account, and let you sign in.",
                    "To make, change and cancel bookings, and to show restaurants who is coming.",
                    "To send you messages about the Service, such as booking confirmations and security notices.",
                    "To keep the Service safe, prevent fraud and abuse, and enforce our Terms.",
                    "To understand how the Service is used, fix problems and improve it.",
                    "To meet our legal obligations.",
                ],
            },
        ],
    },
    {
        id: "legal-bases",
        title: "Our legal reasons",
        blocks: [
            {
                type: "p",
                content:
                    "Where the law requires us to have a legal basis for using your information, we rely on one of these:",
            },
            {
                type: "ul",
                items: [
                    "Contract: we need it to provide the Service you signed up for.",
                    "Legitimate interests: for example keeping the Service secure and improving it, where this doesn't override your rights.",
                    "Consent: for anything optional, which you can withdraw at any time.",
                    "Legal obligation: where we have to keep or share information by law.",
                ],
            },
        ],
    },
    {
        id: "sharing",
        title: "Who we share it with",
        blocks: [
            { type: "p", content: "We do not sell your personal information. We share it only in these situations:" },
            {
                type: "ul",
                items: [
                    "With restaurants: when you book, the restaurant sees your name, contact details and booking information.",
                    "With service providers who help us run the Service, such as hosting, email delivery, analytics and payment providers. They may only use your information to do that work for us.",
                    "When the law requires it, or to protect the rights, safety or property of our users, the public or us.",
                    "In a merger, sale or reorganisation of our business, in which case we will tell you if your information is affected.",
                ],
            },
        ],
    },
    {
        id: "public-info",
        title: "What other people can see",
        blocks: [
            {
                type: "p",
                content:
                    "Restaurant listings and reviews are public. If you post a review, your name (or the display name you choose) may appear next to it. Think before you post anything you wouldn't want others to read.",
            },
        ],
    },
    {
        id: "cookies",
        title: "Cookies and similar technologies",
        blocks: [
            { type: "p", content: "We use cookies and browser storage to:" },
            {
                type: "ul",
                items: [
                    "keep you signed in and protect your account;",
                    "remember basic preferences;",
                    "understand how the Service is used, in aggregate.",
                ],
            },
            {
                type: "p",
                content:
                    "You can block or delete cookies in your browser settings. If you do, parts of the Service, such as staying signed in, may stop working.",
            },
        ],
    },
    {
        id: "retention",
        title: "How long we keep it",
        blocks: [
            {
                type: "p",
                content:
                    "We keep your information for as long as your account is active. After you close your account, we delete or anonymise it, except where we need to keep some of it for a limited time to meet legal obligations, resolve disputes, prevent fraud or enforce our Terms. Backups are cleared on a regular schedule.",
            },
        ],
    },
    {
        id: "security",
        title: "How we protect it",
        blocks: [
            {
                type: "p",
                content:
                    "We use technical and organisational measures to protect your information, including encrypted connections and protected password storage. No system is completely secure, so please use a strong, unique password and keep it private.",
            },
        ],
    },
    {
        id: "your-rights",
        title: "Your rights and choices",
        blocks: [
            { type: "p", content: "Depending on where you live, you may have the right to:" },
            {
                type: "ul",
                items: [
                    "access the personal information we hold about you;",
                    "correct information that is wrong or out of date;",
                    "delete your information or close your account;",
                    "receive a copy of your information in a portable format;",
                    "object to or restrict certain uses of your information;",
                    "withdraw consent where we rely on it.",
                ],
            },
            {
                type: "p",
                content: (
                    <>
                        To use any of these rights, email <Mail />. We may need to check it's really you before we act on a request.
                        If you're unhappy with how we've handled your information, you can also complain to your local data
                        protection authority.
                    </>
                ),
            },
        ],
    },
    {
        id: "transfers",
        title: "Where your information goes",
        blocks: [
            {
                type: "p",
                content:
                    "Our providers may process your information in countries other than the one you live in. Where the law requires it, we put safeguards in place so your information stays protected wherever it is handled.",
            },
        ],
    },
    {
        id: "children",
        title: "Children",
        blocks: [
            {
                type: "p",
                content: (
                    <>
                        The Service is for people aged 18 and over, and we don't knowingly collect information from anyone younger.
                        If you think a child has given us their information, email <Mail /> and we will delete it.
                    </>
                ),
            },
        ],
    },
    {
        id: "changes",
        title: "Changes to this policy",
        blocks: [
            {
                type: "p",
                content:
                    "We may update this policy from time to time. If we make a material change, we will update the date at the top of this page and let you know, for example by email or with a notice in the app.",
            },
        ],
    },
    {
        id: "contact",
        title: "Contact us",
        blocks: [
            {
                type: "p",
                content: (
                    <>
                        Questions or requests about your information? Email <Mail />.
                    </>
                ),
            },
        ],
    },
];

const SUMMARY = [
    "We collect what we need to run your account and your bookings.",
    "Restaurants you book with see your booking details. Service providers who help us run the app see only what they need.",
    "We don't sell your personal information.",
    "You can ask to see, fix or delete your information at any time.",
];

const Privacy = () => (
    <LegalPage
        current="privacy"
        title="Privacy policy"
        intro={`How ${COMPANY} collects, uses and protects your information.`}
        lastUpdated={LAST_UPDATED}
        summary={SUMMARY}
        sections={SECTIONS}
    />
);

export default Privacy;