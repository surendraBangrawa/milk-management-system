#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Always resolve from the project root (parent of scripts/)
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const SHARED_DIR = path.join(PROJECT_ROOT, 'shared', 'translations');
const BACKEND_LOCALES_DIR = path.join(PROJECT_ROOT, 'backend', 'locales');
const FRONTEND_LOCALES_DIR = path.join(PROJECT_ROOT, 'frontend', 'locales');

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copySharedToBackend() {
  console.log('📁 Copying shared translations to backend...');
  ensureDirectoryExists(BACKEND_LOCALES_DIR);
  const files = fs.readdirSync(SHARED_DIR);
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const sourcePath = path.join(SHARED_DIR, file);
      const destPath = path.join(BACKEND_LOCALES_DIR, file);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${file} to backend`);
    }
  });
}

function copySharedToFrontend() {
  console.log('📁 Copying shared translations to frontend...');
  const files = fs.readdirSync(SHARED_DIR);
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const lang = file.replace('.json', '');
      const sourcePath = path.join(SHARED_DIR, file);
      const destDir = path.join(FRONTEND_LOCALES_DIR, lang);
      const destPath = path.join(destDir, 'translation.json');
      ensureDirectoryExists(destDir);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${file} to frontend/${lang}/translation.json`);
    }
  });
}

function validateTranslations() {
  console.log('🔍 Validating translation files...');
  const files = fs.readdirSync(SHARED_DIR);
  const languages = files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  if (languages.length < 2) {
    console.warn('⚠️  Warning: Less than 2 language files found');
    return;
  }
  const referenceLang = languages[0];
  const referencePath = path.join(SHARED_DIR, `${referenceLang}.json`);
  const reference = JSON.parse(fs.readFileSync(referencePath, 'utf8'));
  languages.slice(1).forEach(lang => {
    const langPath = path.join(SHARED_DIR, `${lang}.json`);
    const langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    const missingKeys = findMissingKeys(reference, langData);
    if (missingKeys.length > 0) {
      console.warn(`⚠️  Warning: Missing keys in ${lang}:`, missingKeys);
    } else {
      console.log(`✅ ${lang} translations are complete`);
    }
  });
}

function findMissingKeys(reference, target, prefix = '') {
  const missing = [];
  for (const key in reference) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (!(key in target)) {
      missing.push(fullKey);
    } else if (typeof reference[key] === 'object' && typeof target[key] === 'object') {
      missing.push(...findMissingKeys(reference[key], target[key], fullKey));
    }
  }
  return missing;
}

function main() {
  console.log('🔄 Syncing translations...\n');
  try {
    validateTranslations();
    console.log('');
    copySharedToBackend();
    console.log('');
    copySharedToFrontend();
    console.log('');
    console.log('✅ Translation sync completed successfully!');
  } catch (error) {
    console.error('❌ Error syncing translations:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
