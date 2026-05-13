const projects = [

    {
        id: "aliacademy",
        index: "01",
        name: "Ali Academy",
        url: "projects/aliacademy.html",

        description:
            "A modern educational and learning platform developed for Ali Academy to provide students with accessible online education and course management. The platform supports interactive learning experiences, streamlined content delivery, and efficient administration for instructors and learners. Built with a responsive and scalable architecture for smooth user engagement.",

        stack: [
            "PHP / Laravel",
            "Livewire",
            "JavaScript",
            "HTML",
            "CSS",
            "MySQL"
        ],

        features: [
            "Interactive online learning platform",
            "Course and content management system",
            "Responsive and user-friendly interface",
            "Student and instructor management",
            "Dynamic frontend powered by Livewire",
            "Secure database-driven architecture"
        ]
    },

    {
        id: "nova",
        index: "02",
        name: "Nova",
        url: "projects/nova.html",

        description:
            "Music distribution platform for artists under East Rock Entertainment. Tiered memberships, uploads, and subscriptions.",

        stack: [
            "CodeIgniter / PHP",
            "HTML",
            "CSS",
            "JavaScript",
            "MySQL"
        ]
    },

    {
        id: "nhic",
        index: "03",
        name: "NHIC School Management System",
        url: "projects/nhic.html",

        description:
            "Digital education platform for NHIC. Online learning, parent dashboards, and admin tools. Beta development.",

        stack: [
            "PHP / Laravel",
            "JavaScript",
            "HTML",
            "CSS",
            "MySQL"
        ]
    },

    {
        id: "uecg",
        index: "04",
        name: "UECG Platform",
        url: "projects/uecg.html",

        description:
            "Education consultancy system for UECG. CMS, newsletter, contact, and admin dashboard for institutions and students.",

        stack: [
            "Laravel 10",
            "React.js",
            "MySQL"
        ]
    },

    {
        id: "prestige",
        index: "05",
        name: "Prestige Limo CT",
        url: "projects/prestige.html",

        description:
            "Limousine booking system with online scheduling, Stripe payments, and customer management.",

        stack: [
            "Laravel 10",
            "Blade",
            "JavaScript",
            "Stripe API",
            "MySQL"
        ]
    },

    {
        id: "hamden",
        index: "06",
        name: "Hamden Education Foundation",
        url: "projects/hamden.html",

        description:
            "Web app for Hamden Education Foundation. Multi-role access, admin dashboard, and content management.",

        stack: [
            "PHP / Laravel",
            "HTML",
            "CSS",
            "JavaScript",
            "000webhost"
        ]
    },

    {
        id: "nexttier",
        index: "07",
        name: "Next Tier Solutions",
        url: "projects/nexttier.html",

        description:
            "Corporate web platform for service presentation, content management, and client inquiries.",

        stack: [
            "HTML",
            "CSS",
            "JavaScript",
            "PHP / Laravel"
        ]
    },

    {
        id: "vive",
        index: "08",
        name: "Vive Aventuras Caribeñas",
        url: "projects/vive.html",

        description:
            "Travel experience platform for the Caribbean. Packages, visual showcase, and customer inquiries.",

        stack: [
            "HTML",
            "CSS",
            "JavaScript",
            "PHP"
        ]
    },

    {
        id: "jummah",
        index: "09",
        name: "Jummah Translate",
        url: "projects/jummah.html",

        description:
            "Real-time sermon translation tool for multilingual accessibility. Translation APIs and JS frontend.",

        stack: [
            "JavaScript",
            "Translation APIs"
        ]
    }

];

const projectList = document.getElementById('projectList');

projects.forEach(project => {
    const stackHTML = project.stack.map(tech => `<span>${tech}</span>`).join("");

    const projectHTML = `
        <a href="projects/project-template.html?id=${project.id}" class="project-row">
            <span class="project-index font-display">${project.index}</span>

            <div class="project-details">
                <h3 class="project-name font-display">${project.name}</h3>

                <p class="project-desc font-body">
                    ${project.description}
                </p>

                <div class="project-stack">
                    ${stackHTML}
                </div>
            </div>

            <span class="project-arrow">→</span>
        </a>
    `;

    projectList.insertAdjacentHTML('beforeend', projectHTML);
});