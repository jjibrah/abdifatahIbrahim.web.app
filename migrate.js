import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "./js/firestore.js";

const initialProjects = [
    {
        title: "Amanah Logistics",
        tier: "major",
        status: "Live",
        techStack: ["React", "Firebase", "Node.js", "Maps API"],
        desc: "Designed the systems layer end-to-end for a fast-scaling logistics startup.",
        technicalDeepDive: {
            architecture: "Built around event-driven architecture to ensure dispatchers and drivers remain perfectly synchronized. Heavily utilized Firestore's real-time socket connections.",
            productManagement: "Handled systems-layer coordination, state mutation pipelines, and real-time operations core."
        },
        githubUrl: "https://github.com/jjibrah",
        liveUrl: "https://amanahlogistics.example.com",
        imageUrl: "",
        isMajor: true,
        order: 1
    },
    {
        title: "POTA",
        tier: "major",
        status: "Beta System",
        techStack: ["TypeScript", "Next.js", "Firestore"],
        desc: "An operating system built around systems-thinking workflows and immutable states.",
        technicalDeepDive: {
            architecture: "Leveraged Next.js Server Components for lightning-fast loads, integrated with offline-first hydration.",
            productManagement: "Engineered objective tracking engines and relational data structures for personal outcome optimization."
        },
        githubUrl: "https://github.com/jjibrah",
        liveUrl: "",
        imageUrl: "",
        isMajor: true,
        order: 2
    },
    {
        title: "Idempotency Core",
        tier: "mini",
        status: "Open Source",
        techStack: ["Node.js", "Redis"],
        desc: "Drop-in middleware ensuring exactly-once semantics for volatile network states.",
        technicalDeepDive: {
            architecture: "Uses Redis distributed locks to intercept incoming request signatures.",
            productManagement: "Focused on developer experience and zero-overhead performance."
        },
        githubUrl: "https://github.com/jjibrah",
        liveUrl: "",
        imageUrl: "",
        isMajor: false,
        order: 3
    },
    {
        title: "Google OAuth Module",
        tier: "mini",
        status: "Open Source",
        techStack: ["Node.js", "OAuth 2.0"],
        desc: "Framework-agnostic, robust authentication implementation decoupled from heavy libraries.",
        technicalDeepDive: {
            architecture: "Implemented rigorous refresh-token rotation and HTTP-only cookie strategies.",
            productManagement: "Prioritized absolute control over the auth pipeline and security-first defaults."
        },
        githubUrl: "https://github.com/jjibrah",
        liveUrl: "",
        imageUrl: "",
        isMajor: false,
        order: 4
    }
];

async function migrate() {
    console.log("🚀 Starting Data Migration...");

    try {
        // 1. Clean existing projects (Optional, but good for fresh starts)
        const snapshot = await getDocs(collection(db, "projects"));
        for (const document of snapshot.docs) {
            await deleteDoc(doc(db, "projects", document.id));
        }
        console.log("🧹 Cleaned existing projects.");

        // 2. Upload the new structured data
        for (const project of initialProjects) {
            await addDoc(collection(db, "projects"), project);
            console.log(`✅ Uploaded: ${project.title}`);
        }

        console.log("\n✨ Migration Complete! Your database is now structured for the Bento Grid.");
    } catch (error) {
        console.error("❌ Migration Failed:", error);
    }
}

// Call the migration
migrate();
