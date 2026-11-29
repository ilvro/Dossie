/**
 * Bestiary License & PDF Watermark Verification Service
 * Verifica a posse de livros oficiais de Ordem Paranormal RPG (Jambô Editora)
 * inspecionando a marca d'água digital nos PDFs oficiais, 100% no navegador (client-side).
 */

// Polyfill para ambientes onde Uint8Array.prototype.toHex ainda não está nativo (requerido pelo pdfjs-dist v6)
if (typeof Uint8Array !== 'undefined') {
  if (typeof Uint8Array.prototype.toHex !== 'function') {
    Uint8Array.prototype.toHex = function () {
      return Array.from(this, b => b.toString(16).padStart(2, '0')).join('');
    };
  }
  if (typeof Uint8Array.fromHex !== 'function') {
    Uint8Array.fromHex = function (hexString) {
      const clean = (hexString || '').trim();
      const bytes = new Uint8Array(Math.floor(clean.length / 2));
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
      }
      return bytes;
    };
  }
}

export const BESTIARY_LICENSE_STORAGE_KEY = 'ordem_bestiary_license';

/**
 * Retorna os dados da licença ativa ou null se o bestiário estiver bloqueado.
 */
export function getBestiaryLicense() {
  try {
    const raw = localStorage.getItem(BESTIARY_LICENSE_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.unlocked) return data;
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Retorna true se o usuário já validou seu livro oficial e desbloqueou o Bestiário.
 */
export function isBestiaryUnlocked() {
  const license = getBestiaryLicense();
  return Boolean(license && license.unlocked);
}

/**
 * Determina se uma ficha de ameaça é de conteúdo oficial dos livros de Ordem Paranormal
 * ou se é uma criação própria do usuário (homebrew).
 */
export function isOfficialThreat(sheet) {
  if (!sheet || sheet.systemMode !== 'threat') return false;
  if (sheet.isCustom === true) return false;
  if (sheet.fonte === 'livro-de-regras' || sheet.fonte === 'sobrevivendo-ao-horror') return true;
  if (sheet.id && (sheet.id.startsWith('threat-livro-') || sheet.id.startsWith('threat-lr-') || sheet.id.startsWith('threat-sh-') || sheet.id === 'threat-mv8mkgff-k582')) return true;
  if (sheet.isOfficial === true) return true;
  if (sheet.fonte === 'homebrew') return false;
  return true;
}

/**
 * Salva a licença no localStorage e notifica a aplicação via evento global.
 */
export function saveBestiaryLicense(licenseData = {}) {
  const payload = {
    unlocked: true,
    buyerName: (licenseData.buyerName || '').trim() || 'Comprador Jambô',
    buyerEmail: (licenseData.buyerEmail || '').trim(),
    detectedBook: licenseData.detectedBook || 'Ordem Paranormal RPG',
    fileName: licenseData.fileName || '',
    verifiedAt: Date.now(),
    verifiedKeywords: licenseData.verifiedKeywords || []
  };

  try {
    localStorage.setItem(BESTIARY_LICENSE_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('Falha ao salvar licença do bestiário no localStorage:', e);
  }

  window.dispatchEvent(new CustomEvent('bestiary-license-changed', { detail: payload }));
  return payload;
}

/**
 * Revoga a licença, bloqueando o bestiário novamente (útil para testes ou logout).
 */
export function revokeBestiaryLicense() {
  try {
    localStorage.removeItem(BESTIARY_LICENSE_STORAGE_KEY);
  } catch (e) {
    console.error('Falha ao remover licença do bestiário:', e);
  }

  window.dispatchEvent(new CustomEvent('bestiary-license-changed', { detail: { unlocked: false } }));
}

/**
 * Analisa o arquivo PDF fornecido pelo usuário via FileReader / ArrayBuffer
 * e busca pela marca d'água oficial estampada pela Jambô Editora no rodapé das páginas,
 * bem como termos que atestem ser um livro oficial de Ordem Paranormal.
 *
 * @param {File} file Arquivo PDF selecionado pelo usuário
 * @param {Function} onProgress Callback para status de progresso ({ stage, message })
 * @returns {Promise<{ success: boolean, license: object }>}
 */
export async function verifyPdfFile(file, onProgress = () => {}) {
  if (!file) {
    throw new Error('Nenhum arquivo fornecido.');
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    throw new Error('O arquivo selecionado não é um documento PDF válido.');
  }

  onProgress({ stage: 'loading_lib', message: 'Inicializando leitor seguro de PDF...' });

  // Import dinâmico do PDF.js para não onerar o bundle inicial da ficha
  const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
  const pdfWorkerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;

  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }

  onProgress({ stage: 'reading_file', message: 'Lendo documento localmente...' });
  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    disableRange: true,
    disableStream: true
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;

  if (!numPages || numPages < 1) {
    throw new Error('O arquivo PDF está vazio ou não pôde ser lido.');
  }

  onProgress({ stage: 'scanning', message: `Analisando marca d'água da Jambô (1 a ${Math.min(numPages, 20)} páginas)...` });

  let buyerName = '';
  let buyerEmail = '';
  const detectedKeywords = new Set();
  let detectedBook = 'Ordem Paranormal RPG';

  const pagesToScan = new Set();
  const initialLimit = Math.min(numPages, 15);
  for (let i = 1; i <= initialLimit; i++) pagesToScan.add(i);

  if (numPages > 30) {
    pagesToScan.add(Math.floor(numPages / 2));
    pagesToScan.add(Math.floor(numPages / 2) + 1);
    pagesToScan.add(numPages - 1);
    pagesToScan.add(numPages);
  }

  const keywordPool = [
    'ordem paranormal',
    'sobrevivendo ao horror',
    'livro de regras',
    'jambô',
    'jambo',
    'cellbit',
    'presença perturbadora',
    'sanidade',
    'pontos de vida',
    'criatura',
    'valor de desafio',
    'vd',
    'sangue',
    'morte',
    'energia',
    'conhecimento',
    'medo'
  ];

  for (const pageNum of pagesToScan) {
    try {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items.map(it => it.str);
      const fullPageText = items.join(' ');
      const lower = fullPageText.toLowerCase();

      if (lower.includes('sobrevivendo ao horror')) {
        detectedBook = 'Ordem Paranormal - Sobrevivendo ao Horror';
      } else if (lower.includes('livro de regras')) {
        detectedBook = 'Ordem Paranormal - Livro de Regras';
      }

      for (const kw of keywordPool) {
        if (lower.includes(kw)) {
          detectedKeywords.add(kw);
        }
      }

      // Procura marca d'água nas strings dos itens
      for (const item of items) {
        const emailMatch = item.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          if (!buyerEmail) buyerEmail = emailMatch[1];
          const preEmail = item.slice(0, emailMatch.index).trim();
          const cleanName = preEmail
            .replace(/^.*?\n/, '')
            .replace(/licenciado\s+para\s+/i, '')
            .replace(/[\(\-–,].*$/, '')
            .trim();

          if (cleanName.length >= 2 && !buyerName) {
            buyerName = cleanName;
          }
        }
      }

      // Se já encontrou comprador e confirmou palavras-chave de Ordem Paranormal, conclui
      if (buyerEmail && detectedKeywords.size >= 2) {
        break;
      }
    } catch (pageErr) {
      console.warn(`Página ${pageNum} ignorada durante análise:`, pageErr);
    }
  }

  if (!buyerEmail) {
    throw new Error(
      'Não encontramos a marca d\'água de compra da Jambô Editora neste PDF.\n' +
      'Certifique-se de utilizar o arquivo original baixado da sua conta na Loja Jambô Editora.'
    );
  }

  if (detectedKeywords.size < 1) {
    throw new Error(
      'A marca d\'água foi localizada, mas o conteúdo do arquivo não corresponde a um livro oficial de Ordem Paranormal RPG.'
    );
  }

  const license = saveBestiaryLicense({
    buyerName: buyerName || 'Comprador Jambô',
    buyerEmail,
    detectedBook,
    fileName: file.name,
    verifiedKeywords: Array.from(detectedKeywords)
  });

  return {
    success: true,
    license
  };
}

/**
 * Outra aba ou card da mesma origem (ex.: vários iframes do Dossiê dentro da Mesa) validou ou bloqueou o livro:
 * avisa esta janela com `bestiary-license-sync`, para ela redesenhar sem recarregar.
 */
export function observarLicencaEmOutrasJanelas(aoMudar) {
  if (typeof window === 'undefined') return () => {};
  const ouvir = e => {
    if (e.key !== null && e.key !== BESTIARY_LICENSE_STORAGE_KEY) return;
    aoMudar(getBestiaryLicense());
  };
  window.addEventListener('storage', ouvir);
  return () => window.removeEventListener('storage', ouvir);
}
