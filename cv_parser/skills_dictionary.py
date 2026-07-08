"""
Skill dictionary for ScriptFusion CV Parser v2.

v1 (in scriptfusion_prototype/) used spaCy's PhraseMatcher, which turned
out to have a real bug: spaCy's tokenizer splits symbol-heavy skill names
inconsistently depending on surrounding punctuation - e.g. "c++" tokenizes
as one token in isolation but "c#" splits into ["c", "#"] when it follows
another word. That mismatch between how the alias and the resume text got
tokenized silently dropped real matches for skills like C#, .NET,
Node.js, CI/CD. v2 replaces PhraseMatcher with plain regex substring
matching on the raw lowercased text (see cv_parser.py) - regex doesn't
care about tokenization, so this bug class goes away entirely.

This dictionary is intentionally large (100+ entries covering languages,
frameworks, databases, cloud/DevOps, mobile, testing, design, data/ML,
methodology, and version control) so common resume terms aren't missed
just because nobody thought to add them yet. Extend it whenever a real
resume shows a skill this list doesn't cover - that's expected maintenance,
not a bug.

Categories:
  language      - programming/scripting languages
  framework     - web/app frameworks and major libraries
  database      - database systems
  cloud_devops  - cloud platforms, CI/CD, infra tooling
  mobile        - mobile-specific frameworks/platforms
  testing       - testing tools/frameworks
  design        - design/UI tools
  data_ml       - data analysis / machine learning tooling
  web           - markup/style/web-platform skills
  methodology   - process/PM methodology (not verifiable via GitHub code,
                  kept for completeness and recruiter context)
  vcs           - version control systems
"""

SKILL_DICTIONARY = {
    # ---- Languages ----
    "Python": {"category": "language", "aliases": ["python", "python3"]},
    "Java": {"category": "language", "aliases": ["java"]},
    "JavaScript": {"category": "language", "aliases": ["javascript", "js", "es6", "ecmascript"]},
    "TypeScript": {"category": "language", "aliases": ["typescript", "ts"]},
    "C": {"category": "language", "aliases": ["c programming language"]},
    "C++": {"category": "language", "aliases": ["c++", "cpp"]},
    "C#": {"category": "language", "aliases": ["c#", "csharp", "c sharp"]},
    "PHP": {"category": "language", "aliases": ["php"]},
    "Kotlin": {"category": "language", "aliases": ["kotlin"]},
    "Swift": {"category": "language", "aliases": ["swift"]},
    "Go": {"category": "language", "aliases": ["golang"]},
    "R": {"category": "language", "aliases": ["r programming", "r language"]},
    "Rust": {"category": "language", "aliases": ["rust"]},
    "Scala": {"category": "language", "aliases": ["scala"]},
    "Perl": {"category": "language", "aliases": ["perl"]},
    "MATLAB": {"category": "language", "aliases": ["matlab"]},
    "Assembly": {"category": "language", "aliases": ["assembly language", "asm"]},
    "Bash/Shell Scripting": {"category": "language", "aliases": ["bash", "shell scripting", "shell script"]},
    "Objective-C": {"category": "language", "aliases": ["objective-c", "objective c"]},
    "Lua": {"category": "language", "aliases": ["lua"]},
    "Haskell": {"category": "language", "aliases": ["haskell"]},
    "VB.NET": {"category": "language", "aliases": ["vb.net", "visual basic"]},
    "Groovy": {"category": "language", "aliases": ["groovy"]},
    "Dart": {"category": "language", "aliases": ["dart"]},
    "SQL": {"category": "database", "aliases": ["sql"]},

    # ---- Frameworks / libraries ----
    "React": {"category": "framework", "aliases": ["react", "react.js", "reactjs"]},
    "Next.js": {"category": "framework", "aliases": ["next.js", "nextjs"]},
    "Nuxt.js": {"category": "framework", "aliases": ["nuxt.js", "nuxtjs"]},
    "Svelte": {"category": "framework", "aliases": ["svelte"]},
    "Node.js": {"category": "framework", "aliases": ["node.js", "nodejs", "node js"]},
    "Express.js": {"category": "framework", "aliases": ["express.js", "expressjs", "express"]},
    "NestJS": {"category": "framework", "aliases": ["nestjs", "nest.js"]},
    "Angular": {"category": "framework", "aliases": ["angular", "angular.js", "angularjs"]},
    "Vue.js": {"category": "framework", "aliases": ["vue.js", "vuejs", "vue"]},
    "Django": {"category": "framework", "aliases": ["django"]},
    "Flask": {"category": "framework", "aliases": ["flask"]},
    "FastAPI": {"category": "framework", "aliases": ["fastapi"]},
    "Spring Boot": {"category": "framework", "aliases": ["spring boot", "spring framework", "springboot"]},
    "Laravel": {"category": "framework", "aliases": ["laravel"]},
    "Ruby on Rails": {"category": "framework", "aliases": ["ruby on rails", "rails"]},
    ".NET": {"category": "framework", "aliases": [".net", "dotnet", "asp.net", "asp.net core"]},
    "Flutter": {"category": "framework", "aliases": ["flutter"]},
    "Bootstrap": {"category": "framework", "aliases": ["bootstrap"]},
    "Tailwind CSS": {"category": "framework", "aliases": ["tailwind css", "tailwindcss", "tailwind"]},
    "jQuery": {"category": "framework", "aliases": ["jquery"]},
    "Redux": {"category": "framework", "aliases": ["redux"]},
    "Astro": {"category": "framework", "aliases": ["astro"]},
    "GraphQL": {"category": "framework", "aliases": ["graphql"]},
    "REST API": {"category": "framework", "aliases": ["rest api", "restful api", "rest apis"]},

    # ---- Mobile ----
    "Android Development": {"category": "mobile", "aliases": ["android development", "android studio"]},
    "iOS Development": {"category": "mobile", "aliases": ["ios development"]},
    "React Native": {"category": "mobile", "aliases": ["react native"]},
    "Xamarin": {"category": "mobile", "aliases": ["xamarin"]},

    # ---- Databases ----
    "MongoDB": {"category": "database", "aliases": ["mongodb", "mongo db"]},
    "MySQL": {"category": "database", "aliases": ["mysql"]},
    "PostgreSQL": {"category": "database", "aliases": ["postgresql", "postgres"]},
    "Firebase": {"category": "database", "aliases": ["firebase"]},
    "SQLite": {"category": "database", "aliases": ["sqlite"]},
    "Oracle Database": {"category": "database", "aliases": ["oracle database", "oracle db"]},
    "MariaDB": {"category": "database", "aliases": ["mariadb"]},
    "Redis": {"category": "database", "aliases": ["redis"]},
    "Cassandra": {"category": "database", "aliases": ["cassandra"]},
    "DynamoDB": {"category": "database", "aliases": ["dynamodb"]},
    "Supabase": {"category": "database", "aliases": ["supabase"]},

    # ---- Cloud / DevOps ----
    "Docker": {"category": "cloud_devops", "aliases": ["docker"]},
    "Kubernetes": {"category": "cloud_devops", "aliases": ["kubernetes", "k8s"]},
    "AWS": {"category": "cloud_devops", "aliases": ["aws", "amazon web services"]},
    "Azure": {"category": "cloud_devops", "aliases": ["azure", "microsoft azure"]},
    "Google Cloud": {"category": "cloud_devops", "aliases": ["gcp", "google cloud"]},
    "CI/CD": {"category": "cloud_devops", "aliases": ["ci/cd", "continuous integration", "continuous deployment"]},
    "Jenkins": {"category": "cloud_devops", "aliases": ["jenkins"]},
    "GitHub Actions": {"category": "cloud_devops", "aliases": ["github actions"]},
    "GitLab CI": {"category": "cloud_devops", "aliases": ["gitlab ci"]},
    "Terraform": {"category": "cloud_devops", "aliases": ["terraform"]},
    "Ansible": {"category": "cloud_devops", "aliases": ["ansible"]},
    "Nginx": {"category": "cloud_devops", "aliases": ["nginx"]},
    "Apache": {"category": "cloud_devops", "aliases": ["apache server", "apache http server"]},
    "Linux": {"category": "cloud_devops", "aliases": ["linux"]},
    "Unix": {"category": "cloud_devops", "aliases": ["unix"]},

    # ---- Testing ----
    "Jest": {"category": "testing", "aliases": ["jest"]},
    "Selenium": {"category": "testing", "aliases": ["selenium"]},
    "JUnit": {"category": "testing", "aliases": ["junit"]},
    "PyTest": {"category": "testing", "aliases": ["pytest"]},
    "Postman": {"category": "testing", "aliases": ["postman"]},
    "Cypress": {"category": "testing", "aliases": ["cypress"]},

    # ---- Design ----
    "Figma": {"category": "design", "aliases": ["figma"]},
    "Adobe Photoshop": {"category": "design", "aliases": ["photoshop"]},
    "Adobe Illustrator": {"category": "design", "aliases": ["illustrator"]},
    "Adobe XD": {"category": "design", "aliases": ["adobe xd"]},
    "Canva": {"category": "design", "aliases": ["canva"]},
    "Sketch": {"category": "design", "aliases": ["sketch"]},
    "InVision": {"category": "design", "aliases": ["invision"]},
    "WordPress": {"category": "design", "aliases": ["wordpress"]},
    "Framer": {"category": "design", "aliases": ["framer"]},
    "UI/UX Design": {"category": "design", "aliases": ["ui/ux", "ui ux", "ui | ux", "user experience design", "user interface design"]},
    "Graphic Design": {"category": "design", "aliases": ["graphic design", "graphic designing", "graphic designer"]},

    # ---- Data / ML ----
    "TensorFlow": {"category": "data_ml", "aliases": ["tensorflow"]},
    "PyTorch": {"category": "data_ml", "aliases": ["pytorch"]},
    "Keras": {"category": "data_ml", "aliases": ["keras"]},
    "scikit-learn": {"category": "data_ml", "aliases": ["scikit-learn", "sklearn"]},
    "OpenCV": {"category": "data_ml", "aliases": ["opencv"]},
    "Pandas": {"category": "data_ml", "aliases": ["pandas"]},
    "NumPy": {"category": "data_ml", "aliases": ["numpy"]},
    "Matplotlib": {"category": "data_ml", "aliases": ["matplotlib"]},
    "Seaborn": {"category": "data_ml", "aliases": ["seaborn"]},
    "Power BI": {"category": "data_ml", "aliases": ["power bi"]},
    "Tableau": {"category": "data_ml", "aliases": ["tableau"]},
    "Microsoft Excel": {"category": "data_ml", "aliases": ["microsoft excel", "ms excel", "proficiency in microsoft tools"]},

    # ---- Web platform ----
    "HTML": {"category": "web", "aliases": ["html", "html5"]},
    "CSS": {"category": "web", "aliases": ["css", "css3"]},
    "Web Development": {"category": "web", "aliases": ["web development", "web developer"]},

    # ---- Version control ----
    "Git": {"category": "vcs", "aliases": ["git"]},
    "GitHub": {"category": "vcs", "aliases": ["github"]},
    "GitLab": {"category": "vcs", "aliases": ["gitlab"]},
    "Bitbucket": {"category": "vcs", "aliases": ["bitbucket"]},
    "SVN": {"category": "vcs", "aliases": ["svn", "subversion"]},

    # ---- Methodology / PM (not GitHub-verifiable, kept for recruiter context) ----
    "Agile": {"category": "methodology", "aliases": ["agile methodology", "agile"]},
    "Scrum": {"category": "methodology", "aliases": ["scrum"]},
    "Kanban": {"category": "methodology", "aliases": ["kanban"]},
    "Jira": {"category": "methodology", "aliases": ["jira"]},
    "Trello": {"category": "methodology", "aliases": ["trello"]},
}

VERIFIABLE_CATEGORIES = set([
    "language", "framework", "database", "cloud_devops", "mobile",
    "testing", "web", "data_ml", "vcs",
])

# Section headers that introduce a resume's skills list. Matched
# case-insensitively at the start of a line. Extend this if your team's
# resume templates use different wording.
SKILLS_SECTION_HEADERS = [
    "technical skills", "programming languages", "core competencies",
    "key skills", "skills", "tech stack", "professional skills",
    "areas of expertise", "competencies",
]

# Other common resume section headers, used to detect where a skills
# section ENDS (i.e. the next header after it starts).
OTHER_SECTION_HEADERS = [
    "experience", "work experience", "working experience", "education",
    "projects", "certifications", "achievements", "references",
    "contact", "summary", "objective", "languages", "interests",
    "hobbies", "publications", "awards",
]


def build_alias_lookup():
    """Returns {alias_lowercase: canonical_skill_name}, longest alias first
    so multi-word aliases (e.g. "ui/ux") get matched before any shorter
    substring could shadow them."""
    lookup = {}
    for canonical, info in SKILL_DICTIONARY.items():
        for alias in info["aliases"]:
            lookup[alias.strip().lower()] = canonical
    # sort by alias length descending for the regex builder in cv_parser.py
    return dict(sorted(lookup.items(), key=lambda kv: -len(kv[0])))
