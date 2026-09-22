import LegalPage, { LegalLink } from "../components/LegalPage.jsx";
import { COMPANY, CONTACT_EMAIL, JURISDICTION, LAST_UPDATED, LIABILITY_CAP } from "./LegalInfo.jsx";

/* Template only, not legal advice: have a lawyer review it before you publish. */

const SECTIONS = [
    {
        id: "accepting",
        title: "Accepting these terms",
        blocks: [
            {
                type: "p",
                content: (
                    <>
                        By creating an account or using {COMPANY} (the "Service"), you agree to these Terms and to our{" "}
                        <LegalLink to="/privacy">Privacy Policy</LegalLink>. If you don't agree, please don't use the Service.
                    </>
                ),
            },
            {
                type: "p",
                content:
                    "If you use the Service on behalf of a business, you confirm that you have the authority to bind that business to these Terms.",
            },
        ],
    },
    {
        id: "accounts",
        title: "Your account",
        blocks: [
            {
                type: "ul",
                items: [
                    "You must be at least 18 years old, or the age of majority where you live, to create an account.",
                    "Give us accurate information and keep it up to date.",
                    "Keep your password private. You are responsible for everything that happens under your account.",
                    "Tell us straight away if you think someone has accessed your account without permission.",
                    "One person per account. Please don't share your login.",
                ],
            },
            {
                type: "p",
                content:
                    "When you sign up, you choose to join as a diner or as a restaurant owner. Each has extra terms, set out below.",
            },
        ],
    },
    {
        id: "diners",
        title: "Terms for diners",
        blocks: [
            {
                type: "ul",
                items: [
                    "A booking is an arrangement between you and the restaurant. We help you connect, but the restaurant provides the food and service.",
                    "Each restaurant sets its own cancellation, deposit and no-show rules. Check them before you book.",
                    "Menus, prices, opening hours and availability come from restaurants and can change. Confirm with the restaurant when it matters.",
                    "Reviews must be honest and based on your own experience.",
                ],
            },
        ],
    },
    {
        id: "owners",
        title: "Terms for restaurant owners",
        blocks: [
            {
                type: "ul",
                items: [
                    "You confirm that you are authorised to list and manage the restaurant on the Service.",
                    "Keep your listing accurate, including name, address, hours, menus, prices, photos, and allergen and dietary information.",
                    "Honour confirmed bookings, or cancel with reasonable notice.",
                    "Follow the laws that apply to your business, such as food safety, licensing, consumer protection and allergen labelling.",
                    "Don't post fake reviews, and don't offer rewards in exchange for positive reviews of your restaurant or negative reviews of a competitor.",
                    "You are solely responsible for the food and service you provide.",
                ],
            },
        ],
    },
    {
        id: "conduct",
        title: "Acceptable use",
        blocks: [
            { type: "p", content: "When you use the Service, you agree not to:" },
            {
                type: "ul",
                items: [
                    "break the law or infringe anyone else's rights;",
                    "post content that is false, misleading, abusive, hateful or harassing;",
                    "pretend to be someone else or misrepresent who you work for;",
                    "make bookings you don't intend to keep;",
                    "scrape, copy or harvest data from the Service by automated means without our permission;",
                    "interfere with the Service, probe it for weaknesses, or get around its security;",
                    "use the Service to send spam or unsolicited promotions.",
                ],
            },
        ],
    },
    {
        id: "content",
        title: "Content you post",
        blocks: [
            {
                type: "p",
                content:
                    "You own the content you post, such as reviews, photos and listing details. By posting it, you give us a non-exclusive, worldwide, royalty-free licence to host, display, reproduce and distribute it in connection with running and promoting the Service.",
            },
            {
                type: "p",
                content:
                    "You confirm that you have the right to post your content and that it doesn't violate anyone else's rights. We may remove content that breaks these Terms, but we aren't obliged to monitor everything that is posted.",
            },
        ],
    },
    {
        id: "fees",
        title: "Fees and payments",
        blocks: [
            {
                type: "p",
                content:
                    "Creating an account is free unless we say otherwise. If we introduce paid features, subscriptions or booking fees, we will show you the price before you commit, and any extra terms will apply.",
            },
            {
                type: "p",
                content:
                    "Payment for a meal is made directly between you and the restaurant unless the Service clearly says otherwise.",
            },
        ],
    },
    {
        id: "ip",
        title: "Our intellectual property",
        blocks: [
            {
                type: "p",
                content: `The Service, including its design, software, logos and text (other than content posted by users), belongs to ${COMPANY} or its licensors and is protected by intellectual property laws.`,
            },
            {
                type: "p",
                content:
                    "We give you a limited, non-exclusive, non-transferable and revocable licence to use the Service for its intended purpose. You may not copy, modify, distribute, sell or reverse engineer any part of it, except where the law allows.",
            },
        ],
    },
    {
        id: "third-party",
        title: "Third-party services",
        blocks: [
            {
                type: "p",
                content:
                    "The Service may link to or work with third-party websites, maps or payment providers. We don't control them and aren't responsible for their content or practices. Their own terms apply.",
            },
        ],
    },
    {
        id: "termination",
        title: "Suspension and termination",
        blocks: [
            {
                type: "p",
                content: "You can stop using the Service and close your account at any time.",
            },
            {
                type: "p",
                content:
                    "We may suspend or end your access, with notice where reasonable, if you break these Terms, misuse the Service, put others or the Service at risk, or if the law requires it. Parts of these Terms that are meant to continue, such as the content licence, disclaimers, limits on liability and governing law, will still apply after your account ends.",
            },
        ],
    },
    {
        id: "disclaimers",
        title: "Disclaimers",
        blocks: [
            {
                type: "p",
                content:
                    'The Service is provided "as is" and "as available". We don\'t promise that it will always work without interruption or errors, or that listings, menus, prices, availability or reviews are accurate or complete.',
            },
            {
                type: "p",
                content:
                    "We are not a party to the arrangement between diners and restaurants, and we don't prepare, sell or serve food. If you have an allergy or dietary requirement, always confirm it directly with the restaurant.",
            },
        ],
    },
    {
        id: "liability",
        title: "Limitation of liability",
        blocks: [
            {
                type: "p",
                content: `To the fullest extent the law allows, ${COMPANY} isn't liable for indirect, incidental, special or consequential losses, or for lost profits, data or goodwill, arising from your use of the Service.`,
            },
            {
                type: "p",
                content: `Nothing in these Terms excludes liability that cannot be excluded by law, including liability for fraud, or for death or personal injury caused by negligence. Where liability can be limited, our total liability to you is limited to ${LIABILITY_CAP}.`,
            },
        ],
    },
    {
        id: "changes",
        title: "Changes to these terms",
        blocks: [
            {
                type: "p",
                content:
                    "We may update these Terms from time to time. If we make a material change, we will update the date at the top of this page and let you know, for example by email or with a notice in the app. If you keep using the Service after a change takes effect, you accept the updated Terms.",
            },
        ],
    },
    {
        id: "law",
        title: "Governing law and disputes",
        blocks: [
            {
                type: "p",
                content: `These Terms are governed by the laws of ${JURISDICTION}, and the courts there have jurisdiction, subject to any consumer protections that apply where you live and can't be waived.`,
            },
            {
                type: "p",
                content: "If something goes wrong, please contact us first so we can try to sort it out informally.",
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
                        Questions about these Terms? Email us at{" "}
                        <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 underline underline-offset-2">
                            {CONTACT_EMAIL}
                        </a>
                        . For how we handle your information, see our <LegalLink to="/privacy">Privacy Policy</LegalLink>.
                    </>
                ),
            },
        ],
    },
];

const SUMMARY = [
    "You're responsible for your account and for what you post.",
    "Restaurants set their own menus, prices and cancellation rules. Bookings are between diners and restaurants.",
    "Be honest: no fake reviews and no fake bookings.",
    "We can suspend accounts that break these rules.",
];

const Terms = () => (
    <LegalPage
        current="terms"
        title="Terms and conditions"
        intro={`The ground rules for using ${COMPANY}, for diners and restaurant owners alike.`}
        lastUpdated={LAST_UPDATED}
        summary={SUMMARY}
        sections={SECTIONS}
    />
);

export default Terms;