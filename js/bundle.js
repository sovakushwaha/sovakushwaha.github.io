// Configuration Manager Module
class ConfigManager {
    constructor() {
        this.config = null;
    }

    // Load and parse config
    async loadConfig() {
        try {
            const response = await fetch('./config.json');
            if (!response.ok) {
                throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
            }
            
            this.config = await response.json();
            
            if (!this.config) {
                throw new Error('Failed to parse config file - empty or invalid JSON');
            }
            
            return this.config;
        } catch (error) {
            console.error('Error loading config:', error);
            this.showErrorMessage(error.message);
            return null;
        }
    }

    // Display error message to user
    showErrorMessage(message) {
        document.body.innerHTML = `
            <div style="color: red; padding: 20px; text-align: center;">
                <h1>Error Loading Configuration</h1>
                <p>${message}</p>
                <p>If the problem persists, please check your config.json file format.</p>
            </div>`;
    }

    getConfig() {
        return this.config;
    }

    // Helper function to get section title with fallback
    getSectionTitle(sectionKey) {
        const titles = {
            about: 'About',
            projects: this.config?.projects?.title || 'Projects',
            experience: this.config?.experience?.title || 'Experience',
            education: this.config?.education?.title || 'Education',
            skills: this.config?.skills?.title || 'Skills',
            github_projects: this.config?.github_projects?.title || 'GitHub Projects'
        };
        return titles[sectionKey] || '';
    }

    // Helper function to check if content exists for a section
    hasContent(sectionKey) {
        switch (sectionKey) {
            case 'about':
                return this.config?.about?.paragraphs?.length > 0;
            case 'projects':
                return this.config?.projects?.items?.length > 0;
            case 'experience':
                return this.config?.experience?.jobs?.length > 0;
            case 'education':
                return this.config?.education?.items?.length > 0;
            case 'skills':
                return this.config?.skills?.categories?.length > 0;
            case 'github_projects':
                return Boolean(this.config?.github_username);
            default:
                return true;
        }
    }
}

// SEO Manager Module
class SEOManager {
    setContent(selector, value) {
        const element = document.querySelector(selector);
        if (element && value !== undefined) {
            element.content = value;
        }
    }

    setHref(selector, value) {
        const element = document.querySelector(selector);
        if (element && value) {
            element.href = value;
        }
    }

    updateSEOTags(config) {
        const seo = config.site?.seo || {};
        const title = seo.title || config.site?.title || config.header?.greeting || 'Developer Portfolio';
        const description = seo.description || config.site?.description || 'Developer portfolio';
        const baseUrl = (seo.base_url || '').replace(/\/$/, '');
        const image = seo.og_image || (config.github_username ? `https://avatars.githubusercontent.com/${config.github_username}?s=512` : '');
        const imageAlt = seo.og_image_alt || `Profile photo of ${config.header?.greeting || 'portfolio owner'}`;
        const sameAs = config.social_links?.map(link => link.url).filter(Boolean) || [];

        document.title = title;

        this.setContent('meta[name="description"]', description);
        this.setContent('meta[name="keywords"]', seo.keywords || '');
        this.setContent('meta[name="author"]', seo.author || config.header?.greeting || '');
        this.setContent('meta[name="robots"]', seo.robots || 'index, follow');

        this.setContent('meta[property="og:title"]', title);
        this.setContent('meta[property="og:description"]', description);
        this.setContent('meta[property="og:image"]', image);
        this.setContent('meta[property="og:image:alt"]', imageAlt);
        this.setContent('meta[property="og:url"]', baseUrl);

        this.setContent('meta[property="twitter:title"]', title);
        this.setContent('meta[property="twitter:description"]', description);
        this.setContent('meta[property="twitter:image"]', image);
        this.setContent('meta[property="twitter:image:alt"]', imageAlt);
        this.setContent('meta[property="twitter:card"]', seo.twitter_card || 'summary_large_image');
        this.setContent('meta[property="twitter:url"]', baseUrl);

        this.setHref('link[rel="canonical"]', baseUrl ? `${baseUrl}/` : '');

        const jsonLD = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": config.header?.greeting || '',
            "url": baseUrl,
            "image": image,
            "sameAs": sameAs,
            "knowsAbout": this.getKnowsAbout(config)
        };

        if (config.experience?.jobs?.[0]) {
            jsonLD.jobTitle = config.experience.jobs[0].role;
            jsonLD.worksFor = {
                "@type": "Organization",
                "name": config.experience.jobs[0].company
            };
        }

        const schema = document.querySelector('script[type="application/ld+json"]');
        if (schema) {
            schema.textContent = JSON.stringify(jsonLD, null, 2);
        }
    }

    getKnowsAbout(config) {
        const skills = config.skills?.categories
            ?.flatMap(category => category.items || [])
            .map(item => typeof item === 'object' ? item.name : item)
            .filter(Boolean) || [];

        return [...new Set(skills)].slice(0, 12);
    }
}

// Theme Manager Module
class ThemeManager {
    constructor() {
        this.themeSwitch = null;
        this.root = document.documentElement;
    }

    init() {
        this.themeSwitch = document.querySelector('.theme-switch');
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.root.setAttribute('data-theme', savedTheme);
        this.updateToggleState(savedTheme);

        // Add event listener for theme switch
        if (this.themeSwitch) {
            this.themeSwitch.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        const currentTheme = this.root.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateToggleState(newTheme);
    }

    updateToggleState(theme) {
        if (!this.themeSwitch) return;

        const isDark = theme === 'dark';
        this.themeSwitch.setAttribute('aria-pressed', String(isDark));
        this.themeSwitch.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    }
}

// Loading Manager Module
class LoadingManager {
    // Hide loading screen and show content
    hideLoadingScreen(success = true) {
        const loadingScreen = document.getElementById('loading-screen');
        const container = document.querySelector('.container');
        
        if (success) {
            // Add a small delay to ensure all content has been rendered
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                container.classList.remove('content-hidden');
                container.classList.add('content-visible');
            }, 500);
        } else {
            // Just hide the loading screen on error (error message is already shown)
            loadingScreen.classList.add('hidden');
        }
    }
}

// Section Manager Module
class SectionManager {
    constructor(configManager) {
        this.configManager = configManager;
    }

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    safeUrl(value) {
        const url = String(value || '').trim();
        if (!url) return '';

        if (/^(https?:|mailto:|tel:)/i.test(url)) {
            return this.escapeHtml(url);
        }

        if (/^(\/|\.\/|\.\.\/|#|assets\/)/.test(url)) {
            return this.escapeHtml(url);
        }

        return '';
    }

    listItems(items) {
        const values = Array.isArray(items) ? items : [items].filter(Boolean);
        return values.map(item => `<li>${this.escapeHtml(item)}</li>`).join('');
    }

    toggleSection(sectionClass, isEnabled) {
        const section = document.querySelector(`.${sectionClass}`);
        if (!section) return;

        section.style.display = isEnabled ? 'block' : 'none';
    }

    updatePageContent(config) {
        const features = {
            about: true,
            why_hire: true,
            passion: true,
            projects: true,
            experience: true,
            education: true,
            skills: true,
            cv: true,
            github_projects: true,
            ...config.features
        };

        this.toggleSection('about', features.about);
        this.toggleSection('why-hire', features.why_hire);
        this.toggleSection('passion', features.passion);
        this.toggleSection('projects', features.projects);
        this.toggleSection('experience', features.experience);
        this.toggleSection('education', features.education);
        this.toggleSection('skills', features.skills);
        this.toggleSection('cv', features.cv);
        this.toggleSection('projects-on-github', features.github_projects);

        if (features.about) {
            this.updateAboutSection(config);
        }

        if (features.why_hire) {
            this.updateWhyHireSection(config);
        }

        if (features.passion) {
            this.updatePassionSection(config);
        }

        if (features.projects) {
            this.updateProjectsSection(config);
        }

        if (features.experience) {
            this.updateExperienceSection(config);
        }

        if (features.education) {
            this.updateEducationSection(config);
        }

        if (features.skills) {
            this.updateSkillsSection(config);
        }

        if (features.github_projects && config.github_projects?.title) {
            const githubProjectsTitle = document.querySelector('.projects-on-github h2');
            if (githubProjectsTitle) {
                githubProjectsTitle.textContent = config.github_projects.title;
            }
        }
    }

    updateAboutSection(config) {
        const aboutSection = document.querySelector('.about');
        if (!aboutSection) return;

        if (config.about?.paragraphs?.length) {
            aboutSection.innerHTML = config.about.paragraphs
                .map(paragraph => `<p>${this.escapeHtml(paragraph)}</p>`)
                .join('');
        } else {
            aboutSection.innerHTML = '<p>Welcome to my portfolio.</p>';
        }
    }

    updateWhyHireSection(config) {
        const section = document.querySelector('.why-hire');
        const list = section?.querySelector('.why-hire-list');
        const whyHire = config.why_hire;
        if (!section || !list || !whyHire) return;

        const title = section.querySelector('#why-hire-title');
        const intro = section.querySelector('.why-hire-intro');
        if (title) title.textContent = whyHire.title || '';
        if (intro) intro.textContent = whyHire.intro || '';

        list.replaceChildren();
        const fragment = document.createDocumentFragment();

        (whyHire.items || []).forEach((item, index) => {
            const details = document.createElement('details');
            details.className = 'why-hire-item';
            details.open = index === 0;
            details.innerHTML = `
                <summary>
                    <span>${this.escapeHtml(item.question || '')}</span>
                    <span class="why-hire-toggle" aria-hidden="true"></span>
                </summary>
                <div class="why-hire-answer">
                    <p>${this.escapeHtml(item.answer || '')}</p>
                </div>
            `;
            fragment.appendChild(details);
        });

        list.appendChild(fragment);
    }

    updatePassionSection(config) {
        const section = document.querySelector('.passion');
        const passion = config.passion;
        if (!section || !passion) return;

        const setText = (selector, value) => {
            const element = section.querySelector(selector);
            if (element) element.textContent = value || '';
        };

        setText('.passion-eyebrow', passion.eyebrow);
        setText('#passion-title', passion.title);
        setText('.passion-lead', passion.lead);
        setText('.passion-body', passion.body);

        const topics = section.querySelector('.passion-topics');
        if (topics) {
            topics.replaceChildren();
            (passion.topics || []).forEach(topic => {
                const tag = document.createElement('span');
                tag.textContent = topic;
                topics.appendChild(tag);
            });
        }

        const cta = section.querySelector('.passion-cta');
        const ctaUrl = this.safeUrl(passion.cta?.url);
        if (cta && ctaUrl) {
            cta.href = ctaUrl;
            cta.setAttribute('aria-label', passion.cta?.label || 'Visit YouTube channel');
            const label = cta.querySelector('span');
            if (label) label.textContent = passion.cta?.label || 'Visit YouTube channel';
        } else if (cta) {
            cta.hidden = true;
        }

        const instagramCta = section.querySelector('.passion-instagram');
        const instagramUrl = this.safeUrl(passion.instagram_cta?.url);
        if (instagramCta && instagramUrl) {
            instagramCta.href = instagramUrl;
            instagramCta.setAttribute(
                'aria-label',
                passion.instagram_cta?.label || 'Follow SovaVerse on Instagram'
            );
            const label = instagramCta.querySelector('span');
            if (label) {
                label.textContent = passion.instagram_cta?.label || 'Follow on Instagram';
            }
        } else if (instagramCta) {
            instagramCta.hidden = true;
        }
    }

    updateProjectsSection(config) {
        const projectsSection = document.querySelector('.projects');
        if (!projectsSection) return;

        const titleElement = projectsSection.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = this.configManager.getSectionTitle('projects');
        }

        projectsSection.querySelectorAll('.project-item').forEach(item => item.remove());

        const fragment = document.createDocumentFragment();

        if (config.projects?.items?.length) {
            config.projects.items.forEach(project => {
                fragment.appendChild(this.createProjectItem(project));
            });
        } else {
            const emptyState = document.createElement('div');
            emptyState.className = 'project-item';
            emptyState.innerHTML = `
                <div class="project-content">
                    <h3>Your Projects Will Appear Here</h3>
                    <p class="date">Coming Soon</p>
                    <ul>
                        <li>Add projects to config.json</li>
                        <li>Include project descriptions and optional screenshots</li>
                        <li>Showcase your best work</li>
                    </ul>
                </div>
            `;
            fragment.appendChild(emptyState);
        }

        projectsSection.appendChild(fragment);
    }

    createProjectItem(project) {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';

        const name = this.escapeHtml(project.name || 'Project');
        const date = project.date ? `<p class="date">${this.escapeHtml(project.date)}</p>` : '';
        const descriptionHtml = this.listItems(project.description || 'Project details coming soon.');
        const linksHtml = this.createProjectLinks(project);
        const imageSrc = this.safeUrl(project.picture);

        projectItem.innerHTML = `
            <details class="project-details">
                <summary class="project-header">
                    <div class="project-header-content">
                        <h3>${name}</h3>
                        ${date}
                    </div>
                    <div class="project-accordion-toggle" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                    </div>
                </summary>
                <div class="project-content">
                    <div class="project-content-desktop">
                        <h3>${name}</h3>
                        ${date}
                    </div>
                    <ul>
                        ${descriptionHtml}
                    </ul>
                    ${linksHtml}
                </div>
            </details>
            ${imageSrc ? `
            <div class="project-image">
                <img src="${imageSrc}" alt="${name} project screenshot" loading="lazy">
            </div>
            ` : ''}
        `;

        return projectItem;
    }

    createProjectLinks(project) {
        const links = [];

        if (project.link) {
            links.push(typeof project.link === 'object' ? project.link : {
                url: project.link,
                title: 'View Project'
            });
        }

        if (Array.isArray(project.links)) {
            links.push(...project.links);
        }

        const linkHtml = links
            .map(link => {
                const url = this.safeUrl(link?.url);
                if (!url) return '';

                const title = this.escapeHtml(link.title || link.name || 'View Project');
                const projectName = this.escapeHtml(project.name || 'project');
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${title} for ${projectName}">${title}</a>`;
            })
            .filter(Boolean)
            .join('');

        return linkHtml ? `<div class="project-links">${linkHtml}</div>` : '';
    }

    updateExperienceSection(config) {
        const experienceSection = document.querySelector('.experience');
        if (!experienceSection) return;

        const titleElement = experienceSection.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = this.configManager.getSectionTitle('experience');
        }

        experienceSection.querySelectorAll('.experience-item').forEach(item => item.remove());

        const fragment = document.createDocumentFragment();

        if (config.experience?.jobs?.length) {
            config.experience.jobs.forEach(job => {
                fragment.appendChild(this.createExperienceItem(job));
            });
        } else {
            const emptyState = document.createElement('div');
            emptyState.className = 'experience-item';
            emptyState.innerHTML = `
                <div class="experience-content">
                    <h3>Your Experience Will Appear Here</h3>
                    <p class="date">Ready to showcase your career</p>
                    <ul>
                        <li>Add work experience to config.json</li>
                        <li>Include company logos and concise achievements</li>
                        <li>Highlight measurable impact</li>
                    </ul>
                </div>
            `;
            fragment.appendChild(emptyState);
        }

        experienceSection.appendChild(fragment);
    }

    createExperienceItem(job) {
        const experienceItem = document.createElement('div');
        experienceItem.className = 'experience-item';

        const company = this.escapeHtml(job.company || 'Company');
        const role = this.escapeHtml(job.role || 'Role');
        const date = job.date ? `<p class="date">${this.escapeHtml(job.date)}</p>` : '';
        const responsibilitiesHtml = this.listItems(job.responsibilities || 'Add responsibilities to config.json.');

        const logo = this.safeUrl(job.logo);
        const darkLogo = this.safeUrl(job.logo_dark);
        const logoHtml = logo || darkLogo ? `
            <div class="company-logo">
                ${logo ? `<img src="${logo}" alt="${company} logo" class="light-mode-logo" loading="lazy">` : ''}
                ${darkLogo ? `<img src="${darkLogo}" alt="${company} logo" class="dark-mode-logo" loading="lazy">` : ''}
            </div>
        ` : '';

        experienceItem.innerHTML = `
            <details class="experience-details">
                <summary class="experience-header">
                    <div class="experience-header-content">
                        <h3>${company} | ${role}</h3>
                        ${date}
                    </div>
                    ${logoHtml}
                    <div class="accordion-toggle" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6,9 12,15 18,9"></polyline>
                        </svg>
                    </div>
                </summary>
                <div class="experience-content">
                    <ul>
                        ${responsibilitiesHtml}
                    </ul>
                </div>
            </details>
        `;

        return experienceItem;
    }

    updateEducationSection(config) {
        const section = document.querySelector('.education');
        const timeline = section?.querySelector('.education-timeline');
        if (!section || !timeline) return;

        const titleElement = section.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = this.configManager.getSectionTitle('education');
        }

        timeline.replaceChildren();
        const fragment = document.createDocumentFragment();

        (config.education?.items || []).forEach(item => {
            fragment.appendChild(this.createEducationItem(item));
        });

        timeline.appendChild(fragment);
    }

    createEducationItem(item) {
        const educationItem = document.createElement('article');
        educationItem.className = 'education-item';

        const institution = this.escapeHtml(item.institution || 'Institution');
        const qualification = this.escapeHtml(item.qualification || 'Qualification');
        const date = this.escapeHtml(item.date || '');
        const status = item.status
            ? `<span class="education-status">${this.escapeHtml(item.status)}</span>`
            : '';
        const details = this.listItems(item.details || []);

        educationItem.innerHTML = `
            <div class="education-marker" aria-hidden="true"></div>
            <div class="education-card">
                <div class="education-heading">
                    <div>
                        <h3>${institution}</h3>
                        <p class="education-qualification">${qualification}</p>
                    </div>
                    ${status}
                </div>
                ${date ? `<p class="education-date">${date}</p>` : ''}
                ${details ? `<ul>${details}</ul>` : ''}
            </div>
        `;

        return educationItem;
    }

    updateSkillsSection(config) {
        const skillsSection = document.querySelector('.skills');
        if (!skillsSection) return;

        const titleElement = skillsSection.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = this.configManager.getSectionTitle('skills');
        }

        const skillsGrid = skillsSection.querySelector('.skills-grid');
        if (!skillsGrid) return;

        const fragment = document.createDocumentFragment();
        skillsGrid.innerHTML = '';

        if (config.skills?.categories?.length) {
            config.skills.categories.forEach(category => {
                fragment.appendChild(this.createSkillCategory(category));
            });
        } else {
            const emptyState = document.createElement('div');
            emptyState.className = 'skill-category';
            emptyState.innerHTML = `
                <h3>Your Skills Will Appear Here</h3>
                <ul>
                    <li>Add technical skills to config.json</li>
                    <li>Organize them into categories</li>
                    <li>Include certifications with links</li>
                </ul>
            `;
            fragment.appendChild(emptyState);
        }

        skillsGrid.appendChild(fragment);
    }

    createSkillCategory(category) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'skill-category';

        const itemsHtml = Array.isArray(category.items)
            ? category.items.map(item => this.createSkillItem(item)).join('')
            : this.createSkillItem(category.items);

        categoryDiv.innerHTML = `
            <h3>${this.escapeHtml(category.name || 'Skills')}</h3>
            <ul>
                ${itemsHtml}
            </ul>
        `;

        return categoryDiv;
    }

    createSkillItem(item) {
        if (typeof item === 'object' && item?.name && item?.url) {
            const url = this.safeUrl(item.url);
            const name = this.escapeHtml(item.name);
            if (url) {
                return `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a></li>`;
            }
            return `<li>${name}</li>`;
        }

        return `<li>${this.escapeHtml(item)}</li>`;
    }
}

// Header Manager Module
class HeaderManager {
    // Update header section
    updateHeaderSection(config) {
        // Extract GitHub username for profile image
        const githubUsername = config.github_username || this.extractGithubUsername(config.social_links);
        
        // Prefer a portfolio-specific portrait, then fall back to the GitHub avatar.
        const profileImage = config.header?.profile_image;
        if (profileImage || githubUsername) {
            document.querySelector('.profile-img').src = profileImage ||
                `https://avatars.githubusercontent.com/${githubUsername}?s=320`;
        }
        
        // Update header text
        document.querySelector('h1').textContent = config.header.greeting;
        document.querySelector('.tagline').textContent = config.header.tagline;

        // Update social links
        this.updateSocialLinks(config);
    }

    // Extract GitHub username from social links
    extractGithubUsername(socialLinks) {
        const githubLink = socialLinks?.find(link => link.icon === 'github');
        if (githubLink?.url) {
            const match = githubLink.url.match(/github\.com\/([^\/]+)/);
            return match?.[1];
        }
        return null;
    }

    // Update social links dynamically
    updateSocialLinks(config) {
        const socialLinks = document.querySelector('.social-links');
        const fragment = document.createDocumentFragment();
        
        // Clear existing links
        socialLinks.innerHTML = '';

        // Process social links from config
        if (config.social_links && config.social_links.length > 0) {
            config.social_links.forEach(linkConfig => {
                const link = this.createSocialLink(linkConfig);
                if (link) {
                    fragment.appendChild(link);
                }
            });
        }

        // Append all links at once
        socialLinks.appendChild(fragment);
    }

    // Create individual social link element
    createSocialLink(linkConfig) {
        const iconTemplate = document.querySelector(`#${linkConfig.icon}-icon`);
        if (!iconTemplate) {
            console.warn(`Icon template not found for: ${linkConfig.icon}`);
            return null;
        }

        const iconClone = iconTemplate.content.cloneNode(true);
        const link = document.createElement('a');
        
        link.href = linkConfig.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `${linkConfig.name} Profile`);
        
        link.appendChild(iconClone);
        link.appendChild(document.createTextNode(linkConfig.name));
        
        return link;
    }
}

// GitHub Projects Manager Module
class GitHubProjectsManager {
    constructor() {
        this.projectsContainer = null;
        this.requestTimeoutMs = 5000;
        this.defaultMaxRepos = 6;
        this.defaultTopic = 'featured';
    }

    async fetchJson(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            return response.json();
        } finally {
            clearTimeout(timeoutId);
        }
    }

    setMessage(message) {
        if (!this.projectsContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'loading';
        messageElement.setAttribute('role', 'status');
        messageElement.textContent = message;
        this.projectsContainer.replaceChildren(messageElement);
    }

    getSettings(config) {
        const settings = config.github_projects || {};
        const username = config.github_username;
        const excludedRepos = new Set([
            username,
            ...(settings.excluded_repos || [])
        ].filter(Boolean));

        return {
            mode: settings.mode || (settings.source_url ? 'feed' : 'featured'),
            topic: settings.topic || this.defaultTopic,
            sourceUrl: settings.source_url || '',
            maxRepos: Number.isInteger(settings.max_repos) ? settings.max_repos : this.defaultMaxRepos,
            excludedRepos
        };
    }

    normalizeRepo(repo) {
        return {
            name: repo.name,
            description: repo.description || '',
            url: repo.html_url || repo.url,
            homepage: repo.homepage || '',
            language: repo.language || '',
            stars: repo.stars ?? repo.stargazers_count ?? 0,
            forks: repo.forks ?? repo.forks_count ?? 0,
            topics: repo.topics || [],
            updatedAt: repo.updatedAt || repo.updated_at || '',
            pushedAt: repo.pushedAt || repo.pushed_at || '',
            archived: Boolean(repo.archived),
            fork: Boolean(repo.fork)
        };
    }

    getDisplayRepos(repos, settings) {
        return repos
            .map(repo => this.normalizeRepo(repo))
            .filter(repo => repo.name && repo.url)
            .filter(repo => !repo.archived && !repo.fork)
            .filter(repo => !settings.excludedRepos.has(repo.name))
            .sort((a, b) => {
                if (b.stars !== a.stars) {
                    return b.stars - a.stars;
                }

                const bDate = Date.parse(b.pushedAt || b.updatedAt) || 0;
                const aDate = Date.parse(a.pushedAt || a.updatedAt) || 0;
                return bDate - aDate;
            })
            .slice(0, settings.maxRepos);
    }

    async fetchFromProfileFeed(settings) {
        if (!settings.sourceUrl) {
            return [];
        }

        const repos = await this.fetchJson(settings.sourceUrl);
        if (!Array.isArray(repos)) {
            throw new Error('Repository feed must return an array');
        }

        return this.getDisplayRepos(repos, settings);
    }

    async fetchFeaturedRepos(username, settings) {
        const repos = await this.fetchJson(`https://api.github.com/users/${username}/repos?type=owner&sort=updated&per_page=100`);
        const featuredRepos = repos.filter(repo => repo.topics?.includes(settings.topic));

        return this.getDisplayRepos(featuredRepos, settings);
    }

    async fetchFromGitHubSearch(username, settings) {
        const query = encodeURIComponent(`user:${username} fork:false archived:false`);
        const perPage = Math.min(100, settings.maxRepos + settings.excludedRepos.size + 5);
        const data = await this.fetchJson(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=${perPage}`);

        return this.getDisplayRepos(data.items || [], settings);
    }

    async fetchFromGitHubRepos(username, settings) {
        const repos = await this.fetchJson(`https://api.github.com/users/${username}/repos?type=owner&sort=updated&per_page=100`);

        return this.getDisplayRepos(repos, settings);
    }

    async fetchGitHubProjects(config) {
        this.projectsContainer = document.getElementById('projects');
        const username = config.github_username;
        const settings = this.getSettings(config);

        if (!this.projectsContainer) {
            console.warn('Projects container not found, skipping GitHub projects');
            return;
        }

        if (!username) {
            console.warn('No GitHub username provided, skipping GitHub projects');
            return;
        }

        this.projectsContainer.replaceChildren();

        try {
            const repos = await this.getRepos(username, settings);

            if (repos.length > 0) {
                this.renderProjects(repos, username);
                return;
            }

            if (settings.mode === 'featured') {
                this.setMessage(`No repositories found with the "${settings.topic}" topic.`);
            } else {
                this.setMessage('No public repositories found.');
            }
        } catch (error) {
            this.setMessage('GitHub projects are temporarily unavailable.');
            console.error('Error loading GitHub projects:', error);
        }
    }

    async getRepos(username, settings) {
        if (settings.sourceUrl) {
            try {
                const feedRepos = await this.fetchFromProfileFeed(settings);
                if (feedRepos.length > 0) return feedRepos;
            } catch (error) {
                console.warn('Repository feed failed, falling back to GitHub APIs', error);
            }
        }

        if (settings.mode === 'featured') {
            return this.fetchFeaturedRepos(username, settings);
        }

        try {
            const searchRepos = await this.fetchFromGitHubSearch(username, settings);
            if (searchRepos.length > 0) return searchRepos;
        } catch (error) {
            console.warn('GitHub Search API failed, falling back to user repositories', error);
        }

        return this.fetchFromGitHubRepos(username, settings);
    }

    formatNumber(value) {
        return new Intl.NumberFormat('en-US').format(value || 0);
    }

    createProjectMeta(repo) {
        const meta = document.createElement('div');
        meta.className = 'project-meta';

        const stats = [
            { icon: 'star', label: `${this.formatNumber(repo.stars)} stars` },
            { icon: 'call_split', label: `${this.formatNumber(repo.forks)} forks` }
        ];

        if (repo.language) {
            stats.push({ icon: 'code', label: repo.language });
        }

        stats.forEach(stat => {
            const item = document.createElement('span');
            item.className = 'project-stat';

            const icon = document.createElement('span');
            icon.className = 'material-symbols-outlined';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = stat.icon;

            const label = document.createElement('span');
            label.textContent = stat.label;

            item.append(icon, label);
            meta.appendChild(item);
        });

        return meta;
    }

    createTopics(repo) {
        const topics = repo.topics.slice(0, 3);
        if (topics.length === 0) {
            return null;
        }

        const topicList = document.createElement('div');
        topicList.className = 'project-topics';

        topics.forEach(topic => {
            const item = document.createElement('span');
            item.textContent = topic;
            topicList.appendChild(item);
        });

        return topicList;
    }

    renderProjects(repos, username) {
        const fragment = document.createDocumentFragment();

        repos.forEach((repo, index) => {
            const card = this.createGitHubProjectCard(repo, index);
            fragment.appendChild(card);
        });

        this.projectsContainer.appendChild(fragment);
        this.addSeeAllRepositoriesLink(username);
    }

    createGitHubProjectCard(repo, index) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.style.animationDelay = `${index * 0.1}s`;

        const title = document.createElement('h3');
        const titleLink = document.createElement('a');
        titleLink.href = repo.url;
        titleLink.target = '_blank';
        titleLink.rel = 'noopener noreferrer';
        titleLink.setAttribute('aria-label', `View ${repo.name} repository on GitHub`);
        titleLink.textContent = repo.name;
        title.appendChild(titleLink);

        const meta = this.createProjectMeta(repo);

        const description = document.createElement('p');
        description.textContent = repo.description || 'No description provided.';

        const topics = this.createTopics(repo);

        const links = document.createElement('div');
        links.className = 'project-links';

        const repositoryLink = document.createElement('a');
        repositoryLink.href = repo.url;
        repositoryLink.target = '_blank';
        repositoryLink.rel = 'noopener noreferrer';
        repositoryLink.setAttribute('aria-label', `View ${repo.name} repository on GitHub`);
        repositoryLink.textContent = 'View Repository';
        links.appendChild(repositoryLink);

        if (repo.homepage) {
            const homepageLink = document.createElement('a');
            homepageLink.href = repo.homepage;
            homepageLink.target = '_blank';
            homepageLink.rel = 'noopener noreferrer';
            homepageLink.setAttribute('aria-label', `View live demo of ${repo.name}`);
            homepageLink.textContent = 'Live Demo';
            links.appendChild(homepageLink);
        }

        card.append(title, meta, description);
        if (topics) {
            card.appendChild(topics);
        }
        card.appendChild(links);
        return card;
    }

    addSeeAllRepositoriesLink(username) {
        const projectsSection = document.querySelector('.projects-on-github');
        if (!projectsSection) return;

        let seeAllLink = projectsSection.querySelector('.see-all-repos');

        if (!seeAllLink) {
            seeAllLink = document.createElement('div');
            seeAllLink.className = 'see-all-repos';

            const link = document.createElement('a');
            link.href = `https://github.com/${username}?tab=repositories`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('aria-label', `See all GitHub repositories for ${username}`);
            link.textContent = 'See all repositories';

            const icon = document.createElement('span');
            icon.className = 'material-symbols-outlined';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = 'arrow_forward';

            link.appendChild(icon);
            seeAllLink.appendChild(link);
            projectsSection.appendChild(seeAllLink);
        }
    }
}

// Top-level Curriculum Vitae actions and in-page PDF viewer
class CVManager {
    updateCVSection(config) {
        const section = document.querySelector('.cv');
        const dialog = document.querySelector('.cv-dialog');
        const cv = config.cv;

        if (!section || !dialog || !cv?.file) return;

        const title = cv.title || 'Curriculum Vitae';
        const fileUrl = cv.file;
        const titleElement = section.querySelector('#cv-title');
        const description = section.querySelector('.cv-description');
        const downloadLink = section.querySelector('.cv-download');
        const openButton = section.querySelector('.cv-open');
        const closeButton = dialog.querySelector('.cv-dialog-close');
        const iframe = dialog.querySelector('iframe');
        const fallbackLink = dialog.querySelector('.cv-viewer-fallback a');

        titleElement.textContent = title;
        description.textContent = cv.description || '';
        downloadLink.href = fileUrl;
        downloadLink.setAttribute('aria-label', `${cv.download_label || 'Download CV'} as PDF`);
        downloadLink.querySelector('span:last-child').textContent = cv.download_label || 'Download CV';
        openButton.setAttribute('aria-label', `${cv.open_label || 'Preview CV'} in page`);
        openButton.querySelector('span:last-child').textContent = cv.open_label || 'Preview CV';
        iframe.src = fileUrl;
        fallbackLink.href = fileUrl;
        fallbackLink.target = '_blank';
        fallbackLink.rel = 'noopener noreferrer';

        openButton.addEventListener('click', () => {
            if (typeof dialog.showModal === 'function') {
                dialog.showModal();
                return;
            }

            window.open(fileUrl, '_blank', 'noopener,noreferrer');
        });
        closeButton.addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', event => {
            if (event.target === dialog) dialog.close();
        });
    }
}

// Footer Manager Module
class FooterManager {
    updateFooterSection(config) {
        if (!config.footer) return;

        const footer = document.querySelector('.footer');
        if (!footer) return;

        this.updateAvailability(footer, config.footer);

        // Update footer tagline
        this.updateFooterTagline(config.footer);

        // Update footer social links
        if (config.footer.show_social_links) {
            this.updateFooterSocialLinks(config);
        }
    }

    updateAvailability(footer, footerConfig) {
        const availabilityElement = footer.querySelector('.footer-availability');
        if (!availabilityElement) return;

        if (footerConfig.availability_label) {
            availabilityElement.textContent = footerConfig.availability_label;
            availabilityElement.hidden = false;
        } else {
            availabilityElement.hidden = true;
        }
    }

    updateFooterTagline(footerConfig) {
        const taglineElement = document.querySelector('.footer-tagline');
        if (taglineElement && footerConfig.tagline) {
            taglineElement.textContent = footerConfig.tagline;
        }
    }

    updateFooterSocialLinks(config) {
        const footerSocial = document.querySelector('.footer-social');
        if (!footerSocial) return;

        // Clear existing social links
        footerSocial.innerHTML = '';

        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();

        // Use main social_links array (same as header)
        const socialLinks = config.social_links;
        
        if (socialLinks && Array.isArray(socialLinks)) {
            socialLinks.forEach(social => {
                const socialLink = this.createSocialLink(social);
                if (socialLink) {
                    fragment.appendChild(socialLink);
                }
            });
        }

        // Add Source Code link only in footer
        if (config.github_username) {
            const sourceCodeLink = this.createSocialLink({
                name: 'Source Code',
                url: `https://github.com/${config.github_username}/${config.github_username}.github.io`,
                icon: 'code'
            });
            if (sourceCodeLink) {
                fragment.appendChild(sourceCodeLink);
            }
        }

        // Fallback: Add GitHub link if no social_links array exists but github_username is present
        if ((!socialLinks || socialLinks.length === 0) && config.github_username) {
            const githubLink = this.createSocialLink({
                name: 'GitHub',
                url: `https://github.com/${config.github_username}`,
                icon: 'github'
            });
            if (githubLink) {
                fragment.appendChild(githubLink);
            }
        }

        footerSocial.appendChild(fragment);
    }

    createSocialLink(social) {
        const iconTemplate = document.querySelector(`#${social.icon}-icon`);
        if (!iconTemplate) return null;

        const link = document.createElement('a');
        link.href = social.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', social.name === 'Source Code' ? 'View source code' : `${social.name} Profile`);

        const icon = iconTemplate.content.cloneNode(true);
        link.appendChild(icon);

        return link;
    }

}

// Main Application Module

class PortfolioApp {
    constructor() {
        this.configManager = new ConfigManager();
        this.seoManager = new SEOManager();
        this.themeManager = new ThemeManager();
        this.loadingManager = new LoadingManager();
        this.sectionManager = new SectionManager(this.configManager);
        this.headerManager = new HeaderManager();
        this.githubProjectsManager = new GitHubProjectsManager();
        this.cvManager = new CVManager();
        this.footerManager = new FooterManager();
    }

    async init() {
        try {
            // Initialize theme first
            this.themeManager.init();

            // Load configuration
            const config = await this.configManager.loadConfig();
            if (!config) return;

            // Update SEO tags first
            this.seoManager.updateSEOTags(config);

            // Update header section
            this.headerManager.updateHeaderSection(config);

            // Update page content from config
            this.sectionManager.updatePageContent(config);
            this.cvManager.updateCVSection(config);

            // Update footer section
            this.footerManager.updateFooterSection(config);

            // Initialize scroll controls and desktop disclosure defaults
            this.initScrollToTop();
            this.handleDetailsDisplay();

            // Hide loading screen after the main portfolio content is ready
            this.loadingManager.hideLoadingScreen();

            // Load GitHub projects after the main portfolio is visible.
            const features = { github_projects: true, ...config.features };
            if (features.github_projects && config.github_username) {
                this.githubProjectsManager.fetchGitHubProjects(config).catch(error => {
                    console.error('Error loading GitHub projects:', error);
                });
            }

        } catch (error) {
            console.error('Error initializing portfolio:', error);
            this.loadingManager.hideLoadingScreen(false);
        }
    }

    handleDetailsDisplay() {
        const openDetailsOnDesktop = () => {
            const isDesktop = window.innerWidth >= 769;
            const detailsElements = document.querySelectorAll('.project-details, .experience-details');

            detailsElements.forEach(details => {
                details.open = isDesktop;
            });
        };

        openDetailsOnDesktop();
        window.addEventListener('resize', openDetailsOnDesktop);
    }

    initScrollToTop() {
        const scrollBtn = document.getElementById('scroll-to-top');
        if (!scrollBtn) return;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PortfolioApp();
    app.init();
});
