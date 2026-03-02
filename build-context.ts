import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Pour ES modules en Node.js, __dirname n'est pas disponible par défaut
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration des chemins
const CONTEXT_DIR = path.join(__dirname, '.gemini');
const OUTPUT_FILE = path.join(__dirname, 'GEMINI.md');

const HEADER = `<!--
⚠️ CE FICHIER EST GÉNÉRÉ AUTOMATIQUEMENT ⚠️
Ne le modifiez pas directement. Modifiez plutôt les fichiers dans le dossier .gemini/
et lancez le script de génération.
-->

`;

function buildContext(): void {
  if (!fs.existsSync(CONTEXT_DIR)) {
    console.error(`Erreur: Le dossier ${CONTEXT_DIR} n'existe pas.`);
    console.log(`Créez le dossier et ajoutez-y vos fichiers .md (ex: 00-intro.md, 10-rules.md).`);
    process.exit(1);
  }

  try {
    // Lire les fichiers, filtrer les .md et trier par nom
    const files = fs.readdirSync(CONTEXT_DIR)
      .filter(file => file.endsWith('.md'))
      .sort();

    let content = HEADER;

    files.forEach(file => {
      const filePath = path.join(CONTEXT_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      content += `${fileContent}

`;
    });

    fs.writeFileSync(OUTPUT_FILE, content);
    console.log(`✅ GEMINI.md généré avec succès à partir de ${files.length} fichiers.`);
  } catch (err) {
    console.error('Erreur lors de la génération du contexte :', err);
  }
}

buildContext();
