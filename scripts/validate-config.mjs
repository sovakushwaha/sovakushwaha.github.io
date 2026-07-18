import { existsSync, readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync('config.json', 'utf8'));
const errors = [];

function requireString(path, value) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${path} must be a non-empty string`);
  }
}

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(value);
}

function isSafeAssetUrl(value) {
  if (typeof value !== 'string' || value.trim() !== value || value === '') return false;

  if (isRemoteUrl(value)) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  return /^assets\/[A-Za-z0-9._/-]+$/.test(value)
    && !value.split('/').includes('..')
    && !value.includes('//');
}

function checkAsset(path, value) {
  if (!value) return;
  if (!isSafeAssetUrl(value)) {
    errors.push(`${path} must be a safe HTTPS URL or an assets/ path`);
    return;
  }
  if (isRemoteUrl(value)) return;
  if (!existsSync(value)) {
    errors.push(`${path} points to a missing asset: ${value}`);
  }
}

requireString('github_username', config.github_username);
requireString('header.greeting', config.header?.greeting);
requireString('header.tagline', config.header?.tagline);
requireString('header.email', config.header?.email);
requireString('site.seo.title', config.site?.seo?.title);
requireString('site.seo.description', config.site?.seo?.description);
requireString('site.seo.base_url', config.site?.seo?.base_url);

if (config.header?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.header.email)) {
  errors.push('header.email must be a valid email address');
}

if (!Array.isArray(config.social_links) || config.social_links.length === 0) {
  errors.push('social_links must include at least one link');
}

if (!Array.isArray(config.about?.paragraphs)) {
  errors.push('about.paragraphs must be an array');
}

if (config.features?.why_hire) {
  requireString('why_hire.title', config.why_hire?.title);
  requireString('why_hire.intro', config.why_hire?.intro);

  if (!Array.isArray(config.why_hire?.items) || config.why_hire.items.length === 0) {
    errors.push('why_hire.items must include at least one FAQ item when why_hire is enabled');
  }
}

config.why_hire?.items?.forEach((item, index) => {
  requireString(`why_hire.items[${index}].question`, item.question);
  requireString(`why_hire.items[${index}].answer`, item.answer);
});

function validateProjectItems(sectionKey, items) {
  if (!Array.isArray(items)) {
    errors.push(`${sectionKey}.items must be an array`);
    return;
  }

  items.forEach((project, index) => {
    requireString(`${sectionKey}.items[${index}].name`, project.name);
    const projectPath = `${sectionKey}.items[${index}]`;

    if (project.images !== undefined) {
      if (!Array.isArray(project.images) || project.images.length === 0) {
        errors.push(`${projectPath}.images must be a non-empty array`);
      } else {
        project.images.forEach((image, imageIndex) => {
          const imagePath = `${projectPath}.images[${imageIndex}]`;
          if (!image || typeof image !== 'object' || Array.isArray(image)) {
            errors.push(`${imagePath} must be an object`);
            return;
          }

          requireString(`${imagePath}.src`, image.src);
          requireString(`${imagePath}.alt`, image.alt);
          if (image.caption !== undefined && typeof image.caption !== 'string') {
            errors.push(`${imagePath}.caption must be a string when provided`);
          }
          checkAsset(`${imagePath}.src`, image.src);
        });
      }
    } else if (project.picture) {
      checkAsset(`${projectPath}.picture`, project.picture);
    } else {
      errors.push(`${projectPath} must include images or picture`);
    }
  });
}

validateProjectItems('projects', config.projects?.items);
if (config.features?.powerbi_projects || config.powerbi_projects) {
  requireString('powerbi_projects.title', config.powerbi_projects?.title);
  validateProjectItems('powerbi_projects', config.powerbi_projects?.items);
}

config.experience?.jobs?.forEach((job, index) => {
  requireString(`experience.jobs[${index}].company`, job.company);
  requireString(`experience.jobs[${index}].role`, job.role);
  checkAsset(`experience.jobs[${index}].logo`, job.logo);
  checkAsset(`experience.jobs[${index}].logo_dark`, job.logo_dark);
});

if (config.features?.education && !Array.isArray(config.education?.items)) {
  errors.push('education.items must be an array when education is enabled');
}

if (config.features?.cv) {
  requireString('cv.title', config.cv?.title);
  requireString('cv.description', config.cv?.description);
  requireString('cv.file', config.cv?.file);
  checkAsset('cv.file', config.cv?.file);
}

config.education?.items?.forEach((item, index) => {
  requireString(`education.items[${index}].institution`, item.institution);
  requireString(`education.items[${index}].qualification`, item.qualification);
  requireString(`education.items[${index}].date`, item.date);
});

if (config.github_projects?.mode && !['featured', 'stars', 'feed'].includes(config.github_projects.mode)) {
  errors.push('github_projects.mode must be one of: featured, stars, feed');
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('config.json is valid.');
