// Polyfill para ambientes onde Uint8Array.prototype.toHex ainda não está nativo (pdfjs-dist v6)
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

import { DEFAULT_SHEETS } from './default-sheets.js';
import {
  DEFAULT_ORIGINAL_SHEET,
  normalizeOriginalSheet,
  ATRIBUTOS as ORIGINAL_ATRIBUTOS,
  PERICIAS as ORIGINAL_PERICIAS,
  RITUAIS as ORIGINAL_RITUAIS,
  PODERES_PARANORMAIS as ORIGINAL_PODERES_PARANORMAIS,
  classeAtual,
  bonusPoderesPorPericia as originalBonusPoderesPorPericia,
  calcPvMax as originalCalcPvMax,
  calcPeMax as originalCalcPeMax,
  calcSanMax as originalCalcSanMax,
  calcDtRituais as originalCalcDtRituais,
  snapNex,
  nexDoEstagio,
  ajustarNexDaClasse,
  rotuloNivel,
  definirRegraDeRecursos,
  niveisDaClasse,
  trilhaLiberada,
  pendenciaDeTrilha,
  aplicarVersatilidade,
  recusarVersatilidade,
  atributoEfetivoDaPericia
} from './systems/original/original-system.js';
import { renderDecisaoTrilha, renderEscolhaDeTrilha } from './systems/original/original-views.js';
import {
  definirAumentoAtributo,
  aplicarTransicaoDeClasse,
  reverterTreinoDePoder,
  sincronizarAoMudarNex,
  solicitarPromptProgressao,
  abrirModalProgressao,
  bindEventosProgressaoOriginal,
} from './systems/original/original-progression.js';
import { die } from './dice-icon.js';
import { enhanceSelects } from './custom-select.js';
import { abrirTutorial, fecharTutorial } from './systems/original/original-wizard.js';
import { icon } from './icons.js';
import { renderVigiliaSheet, setVigiliaSide, getVigiliaSide, VIGILIA_SKILL_GRADES } from './systems/vigilia/vigilia-view.js';
import {
  LESOES_TABLE,
  TRAUMAS_TABLE,
  getRelationBenefits,
  getLesaoResult,
  getTraumaResult,
  stepUpPavor,
  stepDownPavor
} from './systems/vigilia/vigilia-mechanics.js';

// Pop-ups de trilha da ficha de Ordem 1: escolha da trilha ao liberá-la e a
// pergunta de Versatilidade a cada NEX de habilidade de trilha.
let promptTrilhaInicial=null, promptTrilhaAdiado=null, promptTrilhaFoco=null;
function mudarNexOriginal(aplicar){
 const antes=trilhaLiberada(state);
 sincronizarAoMudarNex(state, aplicar);
 if(!antes&&trilhaLiberada(state)){promptTrilhaInicial=state.id;promptTrilhaFoco=null;}
 promptTrilhaAdiado=null;
}
function syncPromptDeTrilha(){
 document.querySelector('#trilha-decisao-modal')?.remove();
 if(state?.systemMode==='original'&&!presentationMode){
  let html='';
  const escolhendo=promptTrilhaInicial===state.id;
  if(escolhendo) html=renderEscolhaDeTrilha(state,promptTrilhaFoco);
  else{
   const p=pendenciaDeTrilha(state);
   if(p&&promptTrilhaAdiado!==`${state.id}:${p.tier}`) html=renderDecisaoTrilha(state,{modal:true});
  }
  if(html){
   const modal=document.createElement('div');
   modal.className=`modal open trilha-decisao-modal ${escolhendo?'trilha-escolha-modal':''}`;
   modal.id='trilha-decisao-modal';
   modal.innerHTML=`<div class="backdrop"></div><section>${html}</section>`;
   document.body.appendChild(modal);
  }
 }
 document.querySelectorAll('[data-trilha-decisao]').forEach(btn=>{
  btn.onclick=()=>{
   const p=pendenciaDeTrilha(state);
   if(!p) return;
   const acao=btn.dataset.trilhaDecisao;
   if(acao==='depois'){promptTrilhaAdiado=`${state.id}:${p.tier}`;solicitarPromptProgressao(state.id);render();return;}
   if(acao==='recusar') recusarVersatilidade(state,p.tier);
   if(acao==='versatilidade'){
    const sel=btn.closest('.trilha-decisao')?.querySelector('[data-trilha-decisao-select]');
    if(!aplicarVersatilidade(state,sel?.value)) return;
   }
   solicitarPromptProgressao(state.id);
   save(false);
   render();
  };
 });
 enhanceSelects();
 // Tela de escolha de trilha: clicar numa trilha só muda o foco; confirmar grava.
 document.querySelectorAll('[data-trilha-inicial-opt]').forEach(btn=>{
  btn.onclick=()=>{
   const lista=btn.closest('.wiz-list'),rolagem=lista?lista.scrollTop:0;
   promptTrilhaFoco=btn.dataset.trilhaInicialOpt;
   syncPromptDeTrilha();
   const nova=document.querySelector('#trilha-decisao-modal .wiz-list');
   if(nova) nova.scrollTop=rolagem;
   document.querySelector('#trilha-decisao-modal .wiz-detail')?.classList.add('fx-pick');
  };
 });
 const confirmarTrilha=document.querySelector('[data-trilha-inicial-confirm]');
 if(confirmarTrilha){
  confirmarTrilha.onclick=()=>{
   state.trilhaId=confirmarTrilha.dataset.trilhaInicialConfirm;
   if(state.trilhaSecundariaId===state.trilhaId) state.trilhaSecundariaId='';
   if(state.trilhaTerciariaId===state.trilhaId) state.trilhaTerciariaId='';
   promptTrilhaInicial=null;
   promptTrilhaFoco=null;
   solicitarPromptProgressao(state.id);
   save(false);
   render();
  };
 }
}

import {
  renderTraditionalOriginal,
  renderCinematicOriginal
} from './systems/original/original-views.js';
import { initOriginalCompendium, openOriginalCompendium } from './systems/original/original-compendium.js';
import { normalizeThreatSheet, applyDerivedDice } from './systems/threat/threat-system.js';
import { renderThreatBook } from './systems/threat/threat-views.js';
import { abrirThreatWizard, fecharThreatWizard } from './systems/threat/threat-wizard.js';
import { getBalance, evaluateSheet } from './systems/threat/threat-balance.js';
import { THREAT_ELEMENTS } from './systems/threat/threat-data.js';
import { openThreatExportModal, exportThreatFullImage, exportThreatMiroCard } from './systems/threat/threat-export.js';
import {
  getBestiaryLicense,
  isBestiaryUnlocked,
  revokeBestiaryLicense,
  verifyPdfFile
} from './services/bestiary-license.js';
import {
  renderBestiaryUnlockModalHtml,
  renderBestiaryManageModalHtml
} from './systems/threat/threat-license-ui.js';
import {
  DEFAULT_FOLDERS,
  normalizeFolders,
  migrateSheetsFolders,
  loadFoldersFromStorage,
  persistFoldersToStorage,
  createFolder,
  updateFolder,
  deleteFolder,
  moveFolder
} from './workspace/folders.js';
import { visibleSheets, buildFolderTree, isCharacterSheet, isThreatSheet } from './workspace/selectors.js';
import {
  renderRailScopePills,
  renderRailSwitcher,
  renderWorkspaceNavigator,
  renderNavigatorTreeContent,
  renderQuickSwitcherModal,
  renderQuickSwitcherResults,
  renderMobileSheetDrawer
} from './workspace/workspace-sidebar.js';

let currentOriginalTab = 'habilidades';
let originalSkillsFilter = '';
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();
 deferredInstallPrompt=event;
 document.querySelector('[data-install-app]')?.removeAttribute('hidden');
});
window.addEventListener('appinstalled',()=>{
 deferredInstallPrompt=null;
 document.querySelector('[data-install-app]')?.setAttribute('hidden','');
});

export { icon } from './icons.js';

const DICE_STEPS=[4,6,8,10,12,20];
const TRAINING=[['DESTREINADO',4],['TREINADO',6],['ESPECIALISTA',8],['MESTRE',10],['GRÃO MESTRE',12]];
const PROFILE_COLORS={Executor:'#e0150d',Analista:'#2162ff',Vigilante:'#2d863f'};
const SKILL_INFO={
 'ACROBACIA':['Movimentos de ginástica e parkour, andar de skate ou patins.','Físico'],
 'APTIDÃO (HUMANAS)':['Conhecimento em um campo específico. ARTES: música, dança, escrita, pintura, atuação e outras formas de arte. ATUALIDADES: esporte, entretenimento e cultura popular. BUROCRACIA: direito, política, economia, contabilidade e estruturas governamentais e corporativas. EXATAS: matemática, física, química, biologia, astronomia e geologia. HUMANAS: história, geografia, filosofia, sociologia, teologia e linguística. TÁTICA: educação militar e estratégica.','Mente'],
 'APTIDÃO':['Conhecimento em um campo específico: Artes, Atualidades, Burocracia, Exatas, Humanas ou Tática.','Mente'],
 'ATLETISMO':['Correr, saltar, escalar, nadar e remar.','Físico'],
 'CRIME':['Furtar objetos, abrir fechaduras e falsificar documentos.','Físico'],
 'DISCIPLINA':['Estudar, meditar e resistir a traumas e sustos.','Emoção'],
 'ENGANAÇÃO':['Mentir, disfarçar-se e seduzir.','Emoção'],
 'FURTIVIDADE':['Esconder-se e andar sem ser visto ou ouvido.','Físico'],
 'INTIMIDAR':['Assustar pessoas e coagi-las a fazerem o que você quer.','Emoção'],
 'INTIMIDAÇÃO':['Assustar pessoas e coagi-las a fazerem o que você quer.','Emoção'],
 'INTUIÇÃO':['“Sexto sentido” para analisar pessoas e ambientes.','Emoção'],
 'LUTA':['Atacar desarmado ou com armas corpo a corpo.','Físico'],
 'MÁQUINAS':['Operar e consertar máquinas e dirigir veículos motorizados.','Mente'],
 'MEDICINA':['Primeiros socorros, tratamentos e necropsias.','Mente'],
 'OCULTISMO':['Conhecimento sobre o paranormal.','Mente'],
 'PERCEPÇÃO':['Notar coisas através de visão, audição e olfato e revistar lugares.','Mente'],
 'PERSUASÃO':['Convencer pessoas com argumentos e lábia.','Emoção'],
 'PESQUISAR':['Pesquisar documentos e bancos de dados e analisar evidências.','Mente'],
 'PESQUISA':['Pesquisar documentos e bancos de dados e analisar evidências.','Mente'],
 'PONTARIA':['Atacar com armas de arremesso ou de disparo.','Físico'],
 'SOBREVIVÊNCIA':['Montar acampamento, rastrear e acalmar animais ferozes.','Mente'],
 'TECNOLOGIA':['Operar dispositivos tecnológicos e hackear redes.','Mente'],
 'VIGOR':['Manter o fôlego, resistir a venenos e suportar ferimentos.','Físico']
};
const APTIDAO_FIELDS=['HUMANAS','ARTES','ATUALIDADES','BUROCRACIA','EXATAS','TÁTICA'];
const skillSeed=[
 ['ACROBACIA','DESTREINADO',4,'Físico'],['APTIDÃO (HUMANAS)','TREINADO',6,'Mente'],['ATLETISMO','DESTREINADO',4,'Físico'],['CRIME','TREINADO',6,'Físico'],
 ['DISCIPLINA','TREINADO',6,'Emoção'],['ENGANAÇÃO','TREINADO',6,'Emoção'],['FURTIVIDADE','DESTREINADO',4,'Físico'],['INTIMIDAR','DESTREINADO',4,'Emoção'],
 ['INTUIÇÃO','TREINADO',6,'Emoção'],['LUTA','DESTREINADO',4,'Físico'],['MÁQUINAS','TREINADO',6,'Mente'],['MEDICINA','DESTREINADO',4,'Mente'],
 ['OCULTISMO','TREINADO',6,'Mente'],['PERCEPÇÃO','TREINADO',6,'Mente'],['PERSUASÃO','DESTREINADO',4,'Emoção'],['PESQUISAR','ESPECIALISTA',8,'Mente'],
 ['PONTARIA','DESTREINADO',4,'Físico'],['SOBREVIVÊNCIA','DESTREINADO',4,'Mente'],['TECNOLOGIA','TREINADO',6,'Mente'],['VIGOR','DESTREINADO',4,'Físico']];
const defaultSkills=skillSeed.map(([name,training,skillDie,attribute])=>({name,training,skillDie,attribute,extra:0}));
const defaultCards=[
  {id:'impeto',profileAbility:'Executor',themeLinked:true,schema:'abilities',title:'ÍMPETO',type:'Habilidade de Perfil',content:'Você possui uma [color=#e0150d]**barra de ímpeto, com cinco espaços**[/color]. Sempre que **faz um teste e falha**, você preenche um espaço na **barra de ímpeto**. Como uma ação livre, você pode gastar espaços da barra de ímpeto para receber benefícios.\n- **1 espaço.** Você recebe +1d4 em um teste.\n- **3 espaços.** Você **aumenta um atributo em um passo** até o fim da cena.\n- **3 espaços.** Em cenas de conflito, você **faz uma ação extra**.\n\nNo fim da cena, sua barra de ímpeto esvazia.',accent:'#e0150d',icon:'◆',markers:[{id:'impeto-m',type:'pips',displayStyle:'rectangles',label:'Ímpeto',current:0,maxFormula:'5'}],actions:[]},
  {id:'foco-mental',themeLinked:true,schema:'abilities',title:'FOCO MENTAL',type:'Habilidade',content:'Quando faz um teste mental, você pode gastar 2 PD para receber +4 no teste.',accent:'#e91d25',icon:'◈',markers:[],actions:[{id:'foco-a',name:'Teste mental',expression:'1d8'}]},
  {id:'kit',themeLinked:true,schema:'items',title:'KIT DE INVESTIGAÇÃO',type:'Equipamento',content:'Ferramentas para analisar cenas, coletar amostras e registrar pistas.',accent:'#e91d25',icon:'⌕',markers:[{id:'kit-m',type:'pips',label:'Usos',current:3,maxFormula:'3'}],actions:[]},
  {id:'pistola',themeLinked:true,schema:'items',title:'PISTOLA',type:'Arma',content:'Uma arma de serviço compacta. Dano 1d8.',accent:'#e91d25',icon:'†',markers:[{id:'pistola-m',type:'pips',displayStyle:'rectangles',label:'Munição',current:6,maxFormula:'6'}],actions:[{id:'pistola-a',name:'Ataque de pistola',expression:'1d8'}]}
];
const PROFILE_ABILITIES={
  Executor:defaultCards[0],
  Vigilante:{id:'prontidao',profileAbility:'Vigilante',themeLinked:true,schema:'abilities',title:'PRONTIDÃO',type:'Habilidade de Perfil',cost:'2 PD',content:'**Uma vez por rodada**, quando você ou outro ser em **alcance curto** faz um teste, você pode [color=#2d863f]**gastar 2 PD**[/color] para **rolar novamente**, ou para fazer o outro ser rolar novamente, **um dos dados do teste** cujo resultado **não tenha sido 1**.\n\nAlém disso, em **combates**, você pode fazer sua ação **na fase dela ou em fases posteriores**, e após qualquer ação daquela fase **já ter sido rolada**.',accent:'#2d863f',icon:'◆',markers:[],actions:[]},
  Analista:{id:'analise',profileAbility:'Analista',themeLinked:true,schema:'abilities',title:'ANÁLISE',type:'Habilidade de Perfil',content:'Você pode **gastar uma ação** para receber [color=#2162ff]**2 marcadores de análise**[/color].\n- Quando faz um teste, **pode gastar quantos marcadores quiser após rolar os dados**. Para cada marcador gasto, pode mudar o resultado de um dado **em +1 ou –1** (até o máximo do dado).\n- Você pode acumular **no máximo 4 marcadores de análise** e, no fim da cena, **perde** quaisquer marcadores não usados.',accent:'#2162ff',icon:'◈',markers:[{id:'analise-m',type:'pips',displayStyle:'rectangles',label:'Marcadores de Análise',current:0,maxFormula:'4'}],actions:[]}
};
const defaults={name:'ALAN',occupation:'Cientista',profile:'Executor',level:2,pv:10,maxPv:12,pvTemp:0,pd:16,maxPd:18,pdTemp:0,history:'',tokenImage:'',backgroundImage:'',backgroundBlur:0,backgroundZoom:100,diceColor:'',themeColor:'',viewMode:'traditional',cinematicTokenX:50,cinematicTokenY:52,cinematicTokenScale:100,cinematicOutlineSide:'left',cinematicOutlineIntensity:0.5,cinematicOutlineWidth:1.8,cinematicOutlineFade:1.5,cinematicCollapsed:{abilities:false,items:true,history:true},attributes:{Físico:6,Mente:8,Emoção:8},skills:defaultSkills,cards:defaultCards};

const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const blobUrlCache=new Map();
const decodedBitmapHolders=[];
/* Imagens base64 grandes viram blob: URLs (decodificadas uma única vez e mantidas em cache de bitmap). */
function dataUrlToBlobUrl(value){
 const cached=blobUrlCache.get(value);if(cached)return cached;
 const head=/^data:(image\/[a-z0-9.+-]+);base64,/i.exec(value.slice(0,80));if(!head)return null;
 try{const bin=atob(value.slice(head[0].length)),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);const url=URL.createObjectURL(new Blob([bytes],{type:head[1]}));blobUrlCache.set(value,url);const holder=new Image();holder.decoding='sync';holder.src=url;decodedBitmapHolders.push(holder);return url}catch{return null}
}
const safeUrl=value=>{let s=String(value||'');if(!/^(https?:\/\/|data:image\/|data:video\/|blob:|\/|\.\/)/i.test(s))return'';if(s.startsWith('/assets/'))s='.'+s;if(s.length>8192&&s.charCodeAt(5)===105){const blob=dataUrlToBlobUrl(s);if(blob)return blob}return safe(s)};
const clone=value=>structuredClone(value);
const makeId=prefix=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

function normalizeCard(card){
 const titleUp=String(card.title||'').toUpperCase();
 if(card.id==='impeto'||card.profileAbility==='Executor'||titleUp==='ÍMPETO'){
  if(typeof card.content==='string'&&(card.content.includes('três espaços')||card.content.includes('Receber +4 em um teste'))){
   const prevCurrent=Number(card.markers?.[0]?.current)||0;
   const tpl=clone(PROFILE_ABILITIES.Executor);
   tpl.markers[0].current=Math.min(5,prevCurrent);
   card={...card,...tpl};
  }
 }
 if(card.id==='avaliacao'||card.id==='analise'||card.profileAbility==='Analista'||titleUp==='AVALIAÇÃO'||titleUp==='ANÁLISE'){
  if(titleUp==='AVALIAÇÃO'||(typeof card.content==='string'&&card.content.includes('observar um ser ou ambiente'))){
   const prevCurrent=Number(card.markers?.[0]?.current)||0;
   const tpl=clone(PROFILE_ABILITIES.Analista);
   tpl.markers[0].current=Math.min(4,prevCurrent);
   card={...card,...tpl};
  }
 }
 if(card.id==='prontidao'||card.profileAbility==='Vigilante'||titleUp==='PRONTIDÃO'){
  if(typeof card.content==='string'&&card.content.includes('barra de prontidão')){
   const tpl=clone(PROFILE_ABILITIES.Vigilante);
   card={...card,...tpl};
  }
 }
 const migratedMarkers=Number(card.markerMax)>0?[{id:makeId('marker'),type:'pips',label:card.markerLabel||'Marcador',current:Number(card.markerCurrent)||0,maxFormula:String(card.markerMax)}]:[];
 const migratedActions=Number(card.rollSides)>0?[{id:makeId('action'),name:card.rollName||'Rolar',expression:`1d${card.rollSides}`}]:[];
 const knownProfile=Object.entries(PROFILE_ABILITIES).find(([,template])=>String(template.title).toUpperCase()===String(card.title).toUpperCase());
 const markers=(Array.isArray(card.markers)?card.markers:migratedMarkers).map(marker=>({...marker,displayStyle:marker.displayStyle||'default'}));
 if(card.id==='impeto'||card.id==='analise'||card.id==='pistola')markers.forEach(marker=>{if(marker.type==='pips'&&marker.displayStyle==='default')marker.displayStyle='rectangles'});
 const actions=(Array.isArray(card.actions)?card.actions:migratedActions).map(action=>({...action}));
 return {...card,profileAbility:card.profileAbility||knownProfile?.[0],themeLinked:card.themeLinked!==false,markers,actions};
}
function ensureProfileAbility(sheet,profile=sheet.profile){const template=PROFILE_ABILITIES[profile];if(!template)return;const expected=String(template.title).toUpperCase(),existing=sheet.cards?.find(card=>card.profileAbility===profile||String(card.title).toUpperCase()===expected);if(existing){existing.profileAbility=profile;return}sheet.cards.push(normalizeCard(clone(template)))}
function normalizeSheet(raw={}){
 if(raw && raw.systemMode === 'original'){
  return normalizeOriginalSheet(raw);
 }
 if(raw && raw.systemMode === 'threat'){
  return normalizeThreatSheet(raw);
 }
 const sheet={...clone(defaults),...raw}; sheet.id=raw.id||makeId('sheet');
 sheet.systemMode = 'ordem2';
 sheet.folderId = raw.folderId || 'folder-characters';
 sheet.favorite = Boolean(raw.favorite);
 sheet.attributes={...defaults.attributes,...raw.attributes};
 sheet.skills=Array.isArray(raw.skills)?raw.skills:clone(defaultSkills);
 sheet.skills=sheet.skills.map(skill=>{let name=skill.name==='APTIDÃO'?'APTIDÃO (HUMANAS)':skill.name;let training=skill.training;if(training==='VETERANO')training='ESPECIALISTA';if(training==='EXPERT')training='MESTRE';if(training==='MESTRE'&&Number(skill.skillDie)===12)training='GRÃO MESTRE';const found=TRAINING.find(([label])=>label===training)||TRAINING.find(([,die])=>die===Number(skill.skillDie))||TRAINING[0];return {...skill,name,training:found[0],skillDie:found[1],extra:Number(skill.extra)||0}});
 sheet.cards=(Array.isArray(raw.cards)?raw.cards:clone(defaultCards)).map(normalizeCard);
 ensureProfileAbility(sheet);
 ['pv','maxPv','pvTemp','pd','maxPd','pdTemp','level'].forEach(key=>sheet[key]=Math.max(0,Number(sheet[key])||0));
 sheet.viewMode=['cinematic','traditional','vigilia'].includes(sheet.viewMode)?sheet.viewMode:'traditional';sheet.cinematicTokenX=Math.max(0,Math.min(100,Number(sheet.cinematicTokenX)||50));sheet.cinematicTokenY=Math.max(0,Math.min(100,Number(sheet.cinematicTokenY)||52));sheet.cinematicTokenScale=Math.max(45,Math.min(220,Number(sheet.cinematicTokenScale)||100));
 sheet.cinematicOutlineSide=['left','right','both','none'].includes(raw.cinematicOutlineSide)?raw.cinematicOutlineSide:(raw.profile==='Executor'?'right':'left');
 sheet.cinematicOutlineIntensity=Math.max(0,Math.min(1,Number(raw.cinematicOutlineIntensity??0.5)));
 sheet.cinematicOutlineWidth=Math.max(0,Math.min(10,Number(raw.cinematicOutlineWidth??1.8)));sheet.cinematicOutlineFade=Math.max(0,Math.min(10,Number(raw.cinematicOutlineFade??1.5)));
 sheet.backgroundBlur=Math.max(0,Math.min(50,Number(raw.backgroundBlur??0)));
 sheet.backgroundZoom=Math.max(20,Math.min(300,Number(raw.backgroundZoom??100)));
 sheet.cinematicCollapsed={...defaults.cinematicCollapsed,...sheet.cinematicCollapsed,abilities:false};
 return sheet;
}
const DB_NAME='ordem-ii-db',DB_STORE='sheets-store';
function openDb(){
 return new Promise(resolve=>{
  if(!window.indexedDB)return resolve(null);
  const req=indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>resolve(null);
 });
}
async function idbGet(key){
 try{
  const db=await openDb();
  if(!db)return null;
  return new Promise(resolve=>{
   const tx=db.transaction(DB_STORE,'readonly'),store=tx.objectStore(DB_STORE),req=store.get(key);
   req.onsuccess=()=>resolve(req.result??null);
   req.onerror=()=>resolve(null);
  });
 }catch{return null}
}
async function idbSet(key,value){
 try{
  const db=await openDb();
  if(!db)return false;
  return new Promise(resolve=>{
   const tx=db.transaction(DB_STORE,'readwrite'),store=tx.objectStore(DB_STORE);
   store.put(value,key);
   tx.oncomplete=()=>resolve(true);
   tx.onerror=()=>resolve(false);
  });
 }catch{return false}
}
const SHEETS_KEY='ordem-ii-sheets-v1';
let folders=normalizeFolders(DEFAULT_FOLDERS);
let sheets=[];
let state=normalizeSheet();
let activeSheetId=state.id;

async function loadInitialSheets(){
 try{
  folders=await loadFoldersFromStorage({ idbGet });
 }catch{
  folders=normalizeFolders(DEFAULT_FOLDERS);
 }
 let loaded=null;
 // Tenta carregar do servidor local (só funciona no dev / self-hosted)
 try{
  const res=await fetch('./api/sheets',{cache:'no-store'});
  if(res.ok){
   const data=await res.json();
   if(Array.isArray(data)&&data.length>0)loaded=data.map(normalizeSheet);
  }
 }catch{}
 // Fallback: IndexedDB (dados salvos localmente no navegador)
 if(!loaded||!loaded.length){
  try{
   const idbSheets=await idbGet('sheets');
   if(Array.isArray(idbSheets)&&idbSheets.length>0)loaded=idbSheets.map(normalizeSheet);
  }catch{}
 }
 // Fallback: localStorage
 if(!loaded||!loaded.length){
  try{
   const local=JSON.parse(localStorage.getItem(SHEETS_KEY)||'[]');
   if(Array.isArray(local)&&local.length>0)loaded=local.map(normalizeSheet);
  }catch{}
 }
 // Fallback: fichas padrão embutidas no bundle (primeira visita ao site estático)
 if(!loaded||!loaded.length){
  loaded=DEFAULT_SHEETS.map(normalizeSheet);
 }else if(Array.isArray(DEFAULT_SHEETS)){
  const existingIds=new Set(loaded.map(s=>s.id));
  for(const defSheet of DEFAULT_SHEETS){
   if(!existingIds.has(defSheet.id)){
    loaded.push(normalizeSheet(defSheet));
    existingIds.add(defSheet.id);
   }
  }
 }
 sheets=migrateSheetsFolders(loaded.map(normalizeSheet));
 let storedActiveId=null;
 try{storedActiveId=await idbGet('activeSheetId')||localStorage.getItem('ordem-ii-active-sheet')}catch{}
 state=sheets.find(sheet=>sheet.id===storedActiveId)||sheets[0];
 if(state?.cinematicCollapsed)state.cinematicCollapsed.abilities=false;
 activeSheetId=state.id;
}
let currentRight='abilities',currentView='stats',editMode=false,modeJustChanged=false,editTransitionMode=null,editorMarkers=[],editorActions=[],diceApiPromise,blobBgType='',currentResourceShift=120,mobileTab='agent',sheetDrawerOpen=false,viewSwitchCollapsed=true,presentationMode=true,presentationIndex=0,presentationLockingIn=false,presentationEntering=false,cinematicMobileTab='skills';
const CRITICAL_EFFECTS_KEY='ordem-ii-critical-effects-v1';
let criticalEffects={pv:true,pd:true};
try{criticalEffects={...criticalEffects,...JSON.parse(localStorage.getItem(CRITICAL_EFFECTS_KEY)||'{}')}}catch{}
// Preferências gerais do app (fora dos efeitos críticos).
const APP_SETTINGS_KEY='ordem-ii-app-settings-v1';
let appSettings={
  tutorialOriginal:true,
  sidebarScope:'all',
  sidebarNavigatorOpen:false,
  sidebarNavigatorPinned:false,
  sidebarVisibleFolderIds:[],
  recentSheetIds:[],
  threatFilterElement:'all',
  threatFilterVdRange:'all',
  threatFilterVdMin:'',
  threatFilterVdMax:'',
  threatFilterCategory:'all',
  threatSort:'vd-desc',
  threatGroupBy:'folders',
  threatFiltersOpen:true,
  virtualGroupsCollapsed:{}
};
try{appSettings={...appSettings,...JSON.parse(localStorage.getItem(APP_SETTINGS_KEY)||'{}')}}catch{}
function saveAppSettings(){try{localStorage.setItem(APP_SETTINGS_KEY,JSON.stringify(appSettings))}catch{}}

let sidebarNavigatorOpen = Boolean(appSettings.sidebarNavigatorOpen);
let sidebarNavigatorPinned = Boolean(appSettings.sidebarNavigatorPinned);
let sidebarScope = appSettings.sidebarScope || 'all';
let sidebarSearchQuery = '';
let threatFilterElement = appSettings.threatFilterElement || 'all';
let threatFilterVdRange = appSettings.threatFilterVdRange || 'all';
let threatFilterVdMin = appSettings.threatFilterVdMin || '';
let threatFilterVdMax = appSettings.threatFilterVdMax || '';
let threatFilterCategory = appSettings.threatFilterCategory || 'all';
let threatSort = appSettings.threatSort || 'vd-desc';
let threatGroupBy = appSettings.threatGroupBy || 'folders';
let threatFiltersOpen = appSettings.threatFiltersOpen !== false;
let virtualGroupsCollapsed = appSettings.virtualGroupsCollapsed || {};
let quickSwitcherOpen = false;
let quickSwitcherQuery = '';
let quickSwitcherIndex = 0;
let mobileSearchQuery = '';
let targetFolderForNewSheet = null;

function trackRecentSheet(id){
 if(!id) return;
 appSettings.recentSheetIds = [id, ...(appSettings.recentSheetIds || []).filter(x => x !== id)].slice(0, 8);
 saveAppSettings();
}
function saveCriticalEffects(){try{localStorage.setItem(CRITICAL_EFFECTS_KEY,JSON.stringify(criticalEffects))}catch{}}
function playModeToggleSound(enteringEdit){
 const ctx=getUiAudioContext();if(!ctx)return;
 const now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
 osc.type=enteringEdit?'sawtooth':'sine';
 osc.frequency.setValueAtTime(enteringEdit?290:520,now);
 osc.frequency.exponentialRampToValueAtTime(enteringEdit?540:330,now+0.12);
 gain.gain.setValueAtTime(0.0001,now);
 gain.gain.exponentialRampToValueAtTime(0.045,now+0.01);
 gain.gain.exponentialRampToValueAtTime(0.0001,now+0.15);
 osc.connect(gain).connect(ctx.destination);
 osc.start(now);osc.stop(now+0.16);
}

const getDiceApi=()=>diceApiPromise??=import('./dice3d.js');
const app=document.querySelector('#app');
function formatCardText(value){let text=safe(value);text=text.replace(/(\+?)\s*(\d*)d(4|6|8|10|12|20)\b/gi,(_,plus,count,sides)=>`${plus?'<span class="dice-plus">+</span>':''}${Array.from({length:Math.min(12,Number(count)||1)},()=>die(Number(sides),'inline-die',Number(sides)>4)).join('')}`);text=text.replace(/\*\*(.+?)\*\*/gs,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>').replace(/\[u\](.+?)\[\/u\]/gis,'<u>$1</u>').replace(/\[color=(#[0-9a-f]{6})\](.+?)\[\/color\]/gis,'<span style="color:$1">$2</span>');return text.replace(/\n/g,'<br>')}
const displayOption=option=>option.html||safe(option.label);
function customSelect({value,options,id,className='',disabled=false,formName=''}){const selected=options.find(option=>String(option.value)===String(value))||{label:value};return `${formName?`<input type="hidden" name="${formName}" value="${safe(value)}">`:''}<div class="custom-select ${className} ${disabled?'disabled':''}" data-select-id="${id}" ${formName?`data-form-name="${formName}"`:''}><button type="button" class="select-trigger" ${disabled?'disabled':''}><span class="select-display">${safe(selected.triggerLabel||selected.label)}</span>${icon('chevron',17)}</button><div class="select-menu">${options.map(option=>`<button type="button" class="select-option ${String(option.value)===String(value)?'selected':''}" data-select-value="${safe(option.value)}" data-trigger-label="${safe(option.triggerLabel||option.label)}"><span class="option-content">${displayOption(option)}</span><b>${String(option.value)===String(value)?'✓':''}</b></button>`).join('')}</div></div>`}
function tornTitle(text,wide=false){return `<div class="section-line"><h2 class="torn ${wide?'wide':''}">${text}</h2></div>`}
function pips(current,max,key,temp=0){const regular=Array.from({length:max},(_,i)=>`<button type="button" class="pip ${i<current?'filled':''}" data-set-resource="${key}:${i+1}" aria-label="${i+1}"></button>`).join('');const temporary=Array.from({length:temp},(_,i)=>`<button type="button" class="pip temporary filled" data-consume-temp="${key}:${i+1}" title="${key.toUpperCase()} temporário ${i+1}/${temp} (Clique para extinguir, Botão direito para todos)"></button>`).join('');return regular+temporary}
const formulaKey=value=>String(value).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function formulaVariables(){const attrs=state.attributes||{},threatAttrs=state.atributos||{};return{level:state.level??0,pv:state.pv??state.pvAtual??0,pd:state.pd??0,maxpv:state.maxPv??state.pvMax??0,maxpd:state.maxPd??0,fisico:attrs.Físico??0,mente:attrs.Mente??0,emocao:attrs.Emoção??0,agi:threatAttrs.agi??0,for:threatAttrs.for??0,int:threatAttrs.int??0,pre:threatAttrs.pre??0,vig:threatAttrs.vig??0,vd:state.vd??0}}
function evaluateFormula(expression){const vars=formulaVariables(),expanded=String(expression||'0').replace(/@\{([^}]+)\}/g,(_,key)=>String(vars[formulaKey(key)]??0));if(!/^[\d+\-*/().\s]+$/.test(expanded))return 0;try{return Math.max(0,Math.floor(Function(`"use strict";return (${expanded})`)()))}catch{return 0}}
function markerMax(marker){return Math.min(100,evaluateFormula(marker.maxFormula||'0'))}
function renderMarker(card,marker){const max=markerMax(marker),current=Math.min(Number(marker.current)||0,max||999),id=`${card.id}:${marker.id}`,displayStyle=marker.displayStyle||'default';if(marker.type==='toggle')return `<div class="card-marker marker-toggle style-${displayStyle}"><span>${safe(marker.label)}</span><button class="toggle-switch ${current?'on':''}" data-card-marker="${id}:toggle"><i></i>${current?'LIGADO':'DESLIGADO'}</button></div>`;if(marker.type==='bar'&&displayStyle!=='rectangles')return `<div class="card-marker marker-bar style-${displayStyle}"><div><span>${safe(marker.label)}</span><strong>${current}/${max}</strong></div><button class="progress-track" data-card-marker="${id}:1"><i style="width:${max?current/max*100:0}%"></i></button><div class="marker-buttons"><button data-card-marker="${id}:-1">−</button><button data-card-marker="${id}:1">+</button></div></div>`;if(marker.type==='slots'){const slots=Array.isArray(marker.slots)?marker.slots:[],costRes=(marker.fillCostResource||'pd').toLowerCase(),costAmt=Number(marker.fillCostAmount)||0;if(displayStyle==='rectangles'){const slotItems=Array.from({length:max},(_,i)=>{const val=slots[i],filled=val!==undefined&&val!==null&&val!=='';return `<button type="button" class="value-slot ${filled?'filled':'empty'}" data-use-slot="${id}:${i}" title="${filled?`Espaço ${i+1}: [ ${val} ] (Clique para gastar)`:'Espaço vazio (Clique para preencher)'}"><b class="slot-val">${filled?val:''}</b></button>`}).join('');return `<div class="card-marker marker-value-slots style-rectangles"><span>${safe(marker.label)}</span><div class="value-slots-row">${slotItems}</div></div>`}const fillBtn=costAmt>0?`<button type="button" class="btn-slot-fill" data-fill-marker="${id}" title="Gastar ${costAmt} ${costRes.toUpperCase()} para preencher um espaço">+ PREENCHER (${costAmt} ${costRes.toUpperCase()})</button>`:'';const slotItems=Array.from({length:max},(_,i)=>{const val=slots[i],filled=val!==undefined&&val!==null&&val!=='';return `<button type="button" class="value-slot ${filled?'filled':'empty'}" data-use-slot="${id}:${i}" title="${filled?`Espaço ${i+1}: ${val} (Clique para gastar)`:'Espaço vazio (Clique para preencher)'}"><span class="slot-idx">${i+1}</span><b class="slot-val">${filled?val:'−'}</b></button>`}).join('');return `<div class="card-marker marker-value-slots style-${displayStyle}"><div class="value-slots-top"><span>${safe(marker.label)}</span>${fillBtn}</div><div class="value-slots-row">${slotItems}</div></div>`}if(marker.type==='pips'||(marker.type==='bar'&&displayStyle==='rectangles'))return `<div class="card-marker marker-pips style-${displayStyle}"><span>${safe(marker.label)}</span><div class="marker-pips-track marker-slots">${Array.from({length:max},(_,i)=>`<button class="charge ${i<current?'on':''}" data-card-marker-set="${id}:${i+1}"></button>`).join('')}</div><strong>${current}/${max}</strong></div>`;return `<div class="card-marker style-${displayStyle}"><span>${safe(marker.label)}</span><button data-card-marker="${id}:-1">−</button><strong>${current}${max?`/${max}`:''}</strong><button data-card-marker="${id}:1">+</button></div>`}
function cardAccent(card){return card.themeLinked!==false?getSheetAccent(state):(card.accent||getSheetAccent(state))}
function visibleCards(schema){return state.cards.filter(card=>card.schema===schema&&(!card.profileAbility||card.profileAbility===state.profile))}
function renderResourceCard(card){const image=safeUrl(card.imageUrl)?`<img class="card-image" src="${safeUrl(card.imageUrl)}" alt="">`:'';const markers=(card.markers||[]).map(marker=>renderMarker(card,marker)).join('');const actions=(card.actions||[]).map(action=>`<button class="card-roll" data-expression="${safe(action.expression)}" data-roll-title="${safe(action.name||card.title)}" data-card-id="${card.id}" data-action-id="${action.id}">${die((String(action.expression).match(/d(4|6|8|10|12|20)/i)||[])[1]||20,'micro',true)}<span>${safe(action.name||'Rolar')}</span><small>${safe(action.expression)}</small></button>`).join('');const cost=getCardCost(card);const costBadge=cost?`<span class="dossier-card-cost">${safe(cost)}</span>`:'';return `<article class="ability resource-card dossier-card layout-${safe(card.layout||'standard')} ${card.collapsed?'collapsed':''}" draggable="true" data-card-id="${card.id}" data-filter="${safe((card.title+' '+card.type+' '+card.content).toLowerCase())}" style="--card-accent:${safe(cardAccent(card))};--card-ink:${inkFor(cardAccent(card))}"><header class="card-head dossier-card-head"><div class="card-title-group"><span class="dossier-card-tag">${safe(card.icon||'◆')} ${safe(card.title)}</span>${costBadge}</div><div class="card-actions"><button type="button" data-toggle-card="${card.id}" title="Recolher / Expandir">⌃</button><button type="button" data-move="${card.id}:-1" title="Mover para cima">↑</button><button type="button" data-move="${card.id}:1" title="Mover para baixo">↓</button><button type="button" data-duplicate-card="${card.id}" title="Duplicar">⧉</button><button type="button" data-edit-card="${card.id}" title="Editar habilidade">${icon('edit',14)}</button></div></header><div class="card-details">${image}<div class="card-meta"><span class="dossier-card-type">${safe(card.type||'Habilidade')}</span></div>${markers}<div class="card-copy">${formatCardText(card.content)}</div><div class="card-rolls">${actions}</div></div></article>`}
function dossierResourceEditor(key,badge,title){const maxKey=`max${key[0].toUpperCase()}${key.slice(1)}`,tempKey=`${key}Temp`;return `<div class="resource-row dossier-vital-card resource-${key.toLowerCase()}" data-resource-key="${key}"><div class="vital-header"><span class="vital-badge">${badge}</span><div class="vital-info"><span class="vital-title">${title}</span><span class="vital-numbers"><b>${state[key]}</b><small>/ ${state[maxKey]}</small>${state[tempKey]?`<button type="button" class="temp-badge-btn" data-consume-temp="${key}:1" title="Clique para extinguir 1 ${key.toUpperCase()} temporário (Botão direito para extinguir todos)"><em>+${state[tempKey]}</em></button>`:''}</span></div>${editMode?`<div class="resource-config"><span>MÁX <button data-resource-adjust="${maxKey}:-1">−</button><i>${state[maxKey]}</i><button data-resource-adjust="${maxKey}:1">+</button></span><span>TEMP <button data-resource-adjust="${tempKey}:-1">−</button><i>${state[tempKey]}</i><button data-resource-adjust="${tempKey}:1">+</button></span></div>`:''}</div><div class="pips dossier-pips">${pips(state[key],state[maxKey],key,state[tempKey])}</div></div>`}
function renderTraditional(trainingOptions,bgIsVideo,aptidaoOptions,aptidaoCount){return `<main class="page traditional-dossier-page ${editTransitionMode?`edit-trans-${editTransitionMode}`:''} mobile-tab-${mobileTab} ${modeJustChanged?'mode-enter':''}${bgIsVideo?' has-video-bg':''}" style="--bg-blur:${state.backgroundBlur??0}px;--bg-zoom:${(state.backgroundZoom??100)/100};">${renderBackgroundLayer(bgIsVideo,false)}<header class="dossier-hero"><div class="dossier-photo-col"><div class="dossier-photo-card ${state.tokenImage?'has-token':''}"><div class="dossier-photo-inner" ${state.tokenImage?`style="background-image:url('${safeUrl(state.tokenImage)}')"`:''}>${state.tokenImage?'':`<div class="dossier-photo-ph">${icon('user',42)}<span>FOTO DO AGENTE</span></div>`}</div>${editMode?`<label class="dossier-upload-btn">${icon('image',14)} TROCAR FOTO<input id="token-upload" type="file" accept="image/*"></label>`:''}</div></div><div class="dossier-info-col"><div class="dossier-meta-row"><span class="dossier-profile-pill profile-${state.profile?.toLowerCase()}">${safe(state.profile||'Executor')}</span></div><div class="dossier-name-row">${editMode?`<input class="dossier-name-input" data-field="name" value="${safe(state.name)}" placeholder="NOME DO AGENTE" aria-label="Nome do agente">`:`<h1 class="dossier-name-display">${safe(state.name||'AGENTE SEM NOME')}</h1>`}</div><div class="dossier-creds-row"><div class="dossier-field"><small>OCUPAÇÃO</small><input data-field="occupation" value="${safe(state.occupation)}" placeholder="Ocupação..." ${editMode?'':'readonly'}></div><div class="dossier-field"><small>PERFIL</small>${customSelect({value:state.profile,options:['Executor','Analista','Vigilante'].map(v=>({value:v,label:v})),id:'profile',className:'profile-select dossier-profile-select',disabled:!editMode})}</div><div class="dossier-field field-level"><small>NÍVEL</small><div class="dossier-level-val"><input class="center" data-field="level" value="${state.level}" inputmode="numeric" ${editMode?'':'readonly'}></div></div></div>${editMode?`<div class="dossier-visual-bar"><label class="dossier-chip">${icon('image',13)} FUNDO<input id="background-upload" type="file" accept="image/*,video/mp4,video/webm"></label>${state.backgroundImage?'<button type="button" class="dossier-chip-btn" data-reset-background>PADRÃO</button>':''}<label class="dossier-chip" title="Cor tema da ficha">TEMA<input type="color" data-theme-color value="${safe(getSheetAccent(state))}"></label>${state.themeColor?'<button type="button" class="dossier-chip-btn" data-reset-theme-color title="Voltar à cor do perfil">PERFIL</button>':''}<label class="dossier-chip" title="Cor dos dados">${icon('dice',13)} DADOS<input id="dice-color" type="color" value="${safe(state.diceColor||getSheetAccent(state))}"></label>${state.diceColor?'<button type="button" class="dossier-chip-btn" data-reset-dice-color>PERFIL</button>':''}<label class="dossier-chip range-chip" title="Desfoque da imagem de fundo"><span>BLUR</span><input type="range" min="0" max="30" step="1" value="${state.backgroundBlur??0}" data-cinematic-bg-blur><span class="slider-val-hint" id="val-hint-blur">${state.backgroundBlur??0}px</span></label><label class="dossier-chip range-chip" title="Zoom da imagem de fundo"><span>ZOOM</span><input type="range" min="30" max="250" step="5" value="${state.backgroundZoom??100}" data-cinematic-bg-zoom><span class="slider-val-hint" id="val-hint-zoom">${state.backgroundZoom??100}%</span></label>${(state.backgroundBlur>0||(state.backgroundZoom&&state.backgroundZoom!==100))?'<button type="button" class="dossier-chip-btn" data-reset-bg-effects>RESET BG</button>':''}</div>`:''}</div><div class="dossier-vitals-col"><div class="dossier-vitals-header"><span>MONITORES VITAIS</span><i class="vitals-pulse"></i></div><div class="dossier-vitals-grid">${dossierResourceEditor('pv','PV','PONTOS DE VIDA')}${dossierResourceEditor('pd','PD','DETERMINAÇÃO')}</div></div></header><div class="dossier-body"><section class="dossier-main-col"><div class="dossier-block dossier-attr-block"><div class="dossier-block-header"><span class="block-tag">SEÇÃO I</span><h2>ATRIBUTOS PRINCIPAIS</h2></div><div class="dossier-attr-grid">${Object.entries(state.attributes).map(([name,value])=>`<article class="dossier-attr-card"><div class="dossier-attr-head"><span>${name}</span></div><button type="button" class="attribute-die dossier-die-btn" data-roll="${name}|${value}" title="Clique para rolar ${name} (d${value})">${die(value)}</button>${editMode?attributeStepper(name,value):''}</article>`).join('')}</div></div><div class="dossier-block dossier-skills-block"><div class="dossier-block-header"><span class="block-tag">SEÇÃO II</span><h2>REGISTRO DE PERÍCIAS</h2>${editMode?`<button type="button" class="btn-dossier-add-aptidao" data-add-aptidao title="Adicionar especialização de Aptidão">+ APTIDÃO</button>`:''}</div><div class="dossier-skills-table"><header class="dossier-skills-table-head"><span class="col-name">PERÍCIA ↕</span><span class="col-training">TREINAMENTO ↕</span><span class="col-attr">ATRIBUTO BASE ↕</span><span class="col-extra">EXTRA ↕</span></header><div class="dossier-skills-table-body">${state.skills.map((skill,index)=>{const trained=skill.skillDie>4,attrDie=state.attributes[skill.attribute]||4,isAptidao=skill.name.startsWith('APTIDÃO'),aptidaoField=isAptidao?(skill.name.match(/\(([^)]+)\)/)?.[1]||'HUMANAS'):'',nameCol=editMode&&isAptidao?`<span class="skill-name skill-name-aptidao"><span>APTIDÃO</span>${customSelect({value:aptidaoField,options:aptidaoOptions,id:`aptidao-field:${index}`,className:'aptidao-select'})}<button class="skill-info-button" data-skill-info="${index}" aria-label="Informações sobre ${safe(skill.name)}">${icon('info',14)}</button>${aptidaoCount>1?`<button type="button" class="btn-remove-aptidao" data-remove-aptidao="${index}" title="Remover">${icon('trash',13)}</button>`:''}</span>`:`<span class="skill-name">${safe(skill.name)} <button class="skill-info-button" data-skill-info="${index}" aria-label="Informações sobre ${safe(skill.name)}">${icon('info',14)}</button></span>`;return `<div class="skill-row dossier-skill-row grade-d${skill.skillDie} ${trained?'trained is-trained':'is-untrained'}" data-roll="${safe(skill.name)}|${skill.skillDie},${attrDie}|${skill.extra||0}">${nameCol}<span class="training">${die(skill.skillDie,'small',trained)}${customSelect({value:skill.training,options:trainingOptions,id:`skill-training:${index}`,className:'skill-select training-select',disabled:!editMode})}</span><span class="attribute-ref">${die(attrDie,'small gem',trained)}${customSelect({value:skill.attribute,options:['Físico','Mente','Emoção'].map(v=>({value:v,label:v})),id:`skill-attribute:${index}`,className:'skill-select attribute-select',disabled:!editMode})}</span><span class="extra">${editMode?`<input data-skill-extra="${index}" type="number" value="${skill.extra||0}">`:`${Number(skill.extra)>=0?'+':''}${skill.extra||0}`}</span></div>`}).join('')}</div></div></div></section><aside class="dossier-side-col"><div class="dossier-tabs-nav right-tabs"><button type="button" class="dossier-tab-btn ${currentRight==='abilities'?'active':''}" data-right="abilities">HABILIDADES</button><button type="button" class="dossier-tab-btn ${currentRight==='items'?'active':''}" data-right="items">ITENS</button><button type="button" class="dossier-tab-btn ${currentRight==='history'?'active':''}" data-right="history">HISTÓRIA</button></div><div class="dossier-tools right-tools"><div class="dossier-search-wrap">${icon('search',14)}<input id="filter" placeholder="Filtrar registros..."></div><button type="button" class="dossier-add-btn add" title="Criar card">${icon('plus',15)}<span>CRIAR CARD</span></button></div><section id="abilities" class="right-content ${currentRight==='abilities'?'active':''}">${visibleCards('abilities').map(renderResourceCard).join('')||'<p class="empty-cards">Nenhuma habilidade registrada. Clique em CRIAR CARD para adicionar.</p>'}</section><section id="items" class="right-content ${currentRight==='items'?'active':''}">${visibleCards('items').map(renderResourceCard).join('')||'<p class="empty-cards">Nenhum item registrado. Clique em CRIAR CARD para adicionar.</p>'}</section><section id="history" class="right-content ${currentRight==='history'?'active':''}"><div class="dossier-history-card"><div class="dossier-history-head"><span>RELATÓRIO DE ANTECEDENTES & MOTIVAÇÕES</span></div><textarea data-field="history" placeholder="Escreva aqui a história, investigações anteriores, vínculos e anotações do agente..." ${editMode?'':'readonly'}>${safe(state.history||'')}</textarea></div></section></aside></div></main>`}
function resourceEditor(key,label){const maxKey=`max${key[0].toUpperCase()}${key.slice(1)}`,tempKey=`${key}Temp`;return `<div class="resource-row" data-resource-key="${key}"><strong class="mini-torn">${label}</strong><b>${state[key]}${state[tempKey]?`<button type="button" class="temp-badge-btn" data-consume-temp="${key}:1" title="Clique para extinguir 1 ${key.toUpperCase()} temporário (Botão direito para extinguir todos)"><em>+${state[tempKey]}</em></button>`:''}</b><div class="pips">${pips(state[key],state[maxKey],key,state[tempKey])}</div>${editMode?`<div class="resource-config"><span>MÁX <button data-resource-adjust="${maxKey}:-1">−</button><i>${state[maxKey]}</i><button data-resource-adjust="${maxKey}:1">+</button></span><span>TEMP <button data-resource-adjust="${tempKey}:-1">−</button><i>${state[tempKey]}</i><button data-resource-adjust="${tempKey}:1">+</button></span></div>`:''}</div>`}
function attributeStepper(name,value){return `<div class="attribute-stepper"><button data-attribute-step="${name}:-1">−</button><b>d${value}</b><button data-attribute-step="${name}:1">+</button></div>`}
function syncTokenOutlineFilter(){const flood=document.querySelector('#token-outline-flood'),morph=document.querySelector('#token-outline-morph'),offset=document.querySelector('#token-outline-offset'),blur=document.querySelector('#token-outline-blur'),color=state.diceColor||getSheetAccent(state);const side=state.cinematicOutlineSide||'left',intensity=side==='none'?0:Number(state.cinematicOutlineIntensity??0.5),width=Number(state.cinematicOutlineWidth??1.8),fade=Number(state.cinematicOutlineFade??1.5);let dx=0;if(side==='left')dx=-2.5;else if(side==='right')dx=2.5;if(flood){flood.setAttribute('flood-color',color);flood.setAttribute('flood-opacity',String(intensity))}if(morph){morph.setAttribute('stdDeviation',String(width));morph.setAttribute('radius',String(width))}if(offset){offset.setAttribute('dx',String(dx));offset.setAttribute('dy','0')}if(blur)blur.setAttribute('stdDeviation',String(fade));const tokenImg=document.querySelector('.cinematic-character>img');if(tokenImg)tokenImg.classList.toggle('no-outline',side==='none'||intensity<=0||width<=0)}
const ORIGINAL_CLASS_COLORS = {
  combatente: '#e0150d',
  especialista: '#2162ff',
  ocultista: '#a230ed',
  mundano: '#808080'
};
// Cor de texto legível sobre um fundo na cor dada: preto quando a cor é clara
// demais para texto branco (luminância relativa WCAG), branco caso contrário.
function inkFor(color) {
  const m = /^#([0-9a-f]{6})$/i.exec(String(color || '').trim());
  if (!m) return '#fff';
  const [r, g, b] = [0, 2, 4].map(i => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.42 ? '#111' : '#fff';
}
function getSheetAccent(sheet) {
  if (!sheet) return '#e0150d';
  // Cor tema escolhida pelo jogador tem prioridade sobre a cor da classe/perfil.
  if (/^#[0-9a-f]{6}$/i.test(sheet.themeColor || '')) return sheet.themeColor;
  if (sheet.systemMode === 'threat') {
    return sheet.elementoPrincipalCor || '#993ce8';
  }
  if (sheet.systemMode === 'original') {
    return ORIGINAL_CLASS_COLORS[sheet.classeId] || '#e0150d';
  }
  return PROFILE_COLORS[sheet.profile] || PROFILE_COLORS.Executor;
}
function applyTheme(){const accent=editMode?'#d98b19':(state.themeColor?getSheetAccent(state):(state.diceColor||getSheetAccent(state)));document.documentElement.style.setProperty('--red',accent);document.documentElement.style.setProperty('--red-dark',accent);document.documentElement.style.setProperty('--red-ink',inkFor(accent));document.documentElement.style.setProperty('--cinematic-accent-ink',inkFor(getSheetAccent(state)));document.body.dataset.profile=(state.systemMode==='original'?(state.classeId||'combatente'):(state.systemMode==='threat'?(state.elementos?.[0]||'sangue'):(state.profile||'executor'))).toLowerCase();document.body.classList.toggle('editing',editMode);syncTokenOutlineFilter()}

function getCriticalState(){
 if (state.systemMode === 'threat') {
  const dummy = { value: 0, max: 0, ratio: 1, warning: false, vignette: false, special: false, critical: false, warningIntensity: 0, vignetteIntensity: 0, specialIntensity: 0 };
  return { pv: dummy, pd: dummy, active: false };
 }
 const resource=(current,maximum)=>{const max=Math.max(0,Number(maximum)||0),value=Math.max(0,Number(current)||0),ratio=max>0?Math.min(1,value/max):1,warning=max>0&&ratio<=.5,vignette=max>0&&ratio<=.35,special=max>0&&ratio<=.25,progress=(threshold,floor)=>ratio<=threshold?Math.min(1,floor+(threshold-ratio)/threshold*(1-floor)):0;return{value,max,ratio,warning,vignette,special,critical:special,warningIntensity:progress(.5,.12),vignetteIntensity:progress(.35,.08),specialIntensity:progress(.25,.08)}};
 const pv=resource(state.pv,state.maxPv);
 // Ordem 1: o estado crítico mental acompanha a Sanidade, ou o PD na regra opcional.
 const secCurrent = state.systemMode === 'original' ? (state.usaPD ? state.pe : state.san) : state.pd;
 const secMax = state.systemMode === 'original' ? (state.usaPD ? state.maxPe : state.maxSan) : state.maxPd;
 const pd=resource(secCurrent,secMax);
 return{pv,pd,active:pv.critical||pd.critical};
}
function renderCriticalAtmosphere(){return `<div class="critical-atmosphere" data-critical-atmosphere aria-hidden="true"><div class="critical-pd-darkness"></div><div class="critical-pv-vignette"></div><div class="critical-pd-vignette"></div><canvas class="critical-tendrils" data-critical-tendrils></canvas><div class="critical-distortion"></div></div>`}
function renderCriticalSettings(){const row=(key,title,copy)=>`<div class="critical-setting-row"><span><b>${title}</b><small>${copy}</small></span><button type="button" class="critical-effect-toggle ${criticalEffects[key]?'active':''}" data-critical-effect="${key}" aria-pressed="${criticalEffects[key]}"><i></i><em>${criticalEffects[key]?'ATIVO':'DESATIVADO'}</em></button></div>`;return `<div class="modal critical-settings-modal" id="critical-settings-modal"><div class="backdrop critical-settings-backdrop"></div><section><button type="button" class="critical-settings-close">${icon('close')}</button><small>IMERSÃO & ACESSIBILIDADE</small><h2>EFEITOS CRÍTICOS</h2><p>Escolha quais efeitos atmosféricos podem aparecer. As cores e bordas informativas de PV e PD continuam visíveis.</p>${row('pv','ESTADO CRÍTICO DE PV','Vinheta pulsante e batimento cardíaco sincronizado.')}${row('pd','ESTADO CRÍTICO DE PD','Escurecimento, vibração e formas paranormais.')}<h2 style="margin-top:22px">CRIAÇÃO DE FICHA</h2><div class="critical-setting-row"><span><b>TUTORIAL DE ORDEM PARANORMAL 1</b><small>Ao criar uma ficha, guia a escolha de aprimoramento, origem, atributos, perícias e poder geral.</small></span><button type="button" class="critical-effect-toggle ${appSettings.tutorialOriginal?'active':''}" data-app-setting="tutorialOriginal" aria-pressed="${appSettings.tutorialOriginal}"><i></i><em>${appSettings.tutorialOriginal?'ATIVO':'DESATIVADO'}</em></button></div></section></div>`}

function getCardCost(card){
 if(card.cost !== undefined && card.cost !== null) {
  const trimmed = String(card.cost).trim();
  if(!trimmed || trimmed.toUpperCase() === 'NENHUM' || trimmed === '-') return '';
  return trimmed.toUpperCase();
 }
 const text = (card.content || '').replace(/\[\/?(?:color[^\]]*|b|i|u)\]|\*{1,2}|_{1,2}/gi, ' ');
 const mExplicit = text.match(/\b(?:custo|gasta|gastar|consumo):?\s*(?:de\s+)?(?:uma?\s+ação\s+(?:e\s+)?)?(\d+(?:d\d+)?\s*(?:PD|PV|PE))\b/i);
 if(mExplicit) return mExplicit[1].toUpperCase().replace(/\s+/g,' ');
 const mSimple = text.match(/\b(\d+(?:d\d+)?\s*(?:PD|PV|PE))\b/i);
 if(mSimple) return mSimple[1].toUpperCase().replace(/\s+/g,' ');
 return '';
}

function renderCinematicCard(card){const inlineMarkers=(card.markers||[]).filter(marker=>marker.displayStyle==='rectangles'&&(marker.type==='pips'||marker.type==='bar'||marker.type==='slots')),bodyMarkers=(card.markers||[]).filter(marker=>!inlineMarkers.includes(marker)),actions=(card.actions||[]).map(action=>`<button class="card-roll" data-expression="${safe(action.expression)}" data-roll-title="${safe(action.name||card.title)}" data-card-id="${card.id}" data-action-id="${action.id}">${die((String(action.expression).match(/d(4|6|8|10|12|20)/i)||[])[1]||20,'micro',true)}<span>${safe(action.name||'Rolar')}</span></button>`).join('');const cost=getCardCost(card);const isWeapon=card.type?.toLowerCase().includes('arma')||(card.schema==='items'&&!card.content?.toLowerCase().includes('documento'));const costBadge=cost?`<span class="cinematic-card-cost">${safe(cost)}</span>`:'';return `<article class="cinematic-card ${inlineMarkers.length?'has-inline-marker':''} ${isWeapon?'is-weapon':''}" data-card-id="${card.id}" style="--card-accent:${safe(cardAccent(card))};--card-ink:${inkFor(cardAccent(card))}"><header><h3>${safe(card.title)}</h3>${inlineMarkers.length?`<div class="cinematic-inline-markers">${inlineMarkers.map(marker=>renderMarker(card,marker)).join('')}</div>`:''}${costBadge}${editMode?`<button class="cinematic-card-edit" data-edit-card="${card.id}" title="Editar">${icon('edit',14)}</button>`:''}</header>${bodyMarkers.map(marker=>renderMarker(card,marker)).join('')}<div class="cinematic-card-copy">${formatCardText(card.content)}</div>${actions?`<div class="card-rolls">${actions}</div>`:''}</article>`}
function cinematicSection(key,title,content,addSchema=''){const isLockable=key==='items'||key==='history';const collapsed=(presentationMode&&isLockable)?true:(key==='abilities'?(state.cinematicCollapsed?.abilities===true):!!state.cinematicCollapsed?.[key]);const lockHtml=isLockable?`<i class="cinematic-section-lock" title="Bloqueado no modo apresentação" aria-hidden="true">${icon('lock',15)}</i>`:'';const armorPts=state.armorPoints??(state.pontosArmadura??0);const showArmor=key==='items'&&(state.armorPoints!==undefined||state.pontosArmadura!==undefined||(state.cards||[]).some(c=>c.content&&/armadura/i.test(c.content)));const armorPillHtml=showArmor?`<div class="equip-armor-pill ${armorPts>0?'active':'zero'}" style="margin-left:auto;margin-right:8px;" onclick="event.stopPropagation()"><button type="button" class="btn-armor-spend" data-spend-armor title="Gastar 1 Ponto de Armadura (Ação Livre: reduz dano em 10)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><b>${armorPts}</b> PA</button><span class="armor-stepper-inline"><button type="button" data-armor-step="-1" title="Diminuir Ponto de Armadura (−1 PA)">−</button><button type="button" data-armor-step="1" title="Aumentar Ponto de Armadura (+1 PA)">+</button></span></div>`:'';return `<section class="cinematic-section-group ${collapsed?'collapsed':''} ${isLockable?'section-lockable':''}" data-section-key="${key}"><div class="cinematic-section-heading"><button class="cinematic-section-toggle" data-cinematic-section-toggle="${key}" aria-expanded="${!collapsed}"><span>${lockHtml}${title}</span>${icon('chevron',18)}</button>${armorPillHtml}${editMode&&addSchema?`<button class="cinematic-section-add" data-cinematic-add="${addSchema}" title="Adicionar">${icon('plus',15)}</button>`:''}</div><div class="cinematic-section-body"><div>${content}</div></div></section>`}
function renderBackgroundLayer(bgIsVideo=false,isCinematic=false){
 const bgUrl=safeUrl(state.backgroundImage)||'';
 if(bgIsVideo){
  return `<div class="sheet-background-layer"><video class="bg-video" autoplay loop muted playsinline></video><div class="bg-overlay"></div></div>`;
 }
 if(bgUrl){
  return `<div class="sheet-background-layer"><div class="bg-image" style="background-image:url('${bgUrl}')"></div><div class="bg-overlay"></div></div>`;
 }
 if(state.systemMode === 'threat') return '';
 return `<div class="sheet-background-layer"><div class="bg-image" style="background-image:url('./assets/ordem2-bg.webp')"></div><div class="bg-overlay"></div></div>`;
}

function renderCinematicMobileTabs(){if(presentationMode)return '';const tabs=[{id:'skills',label:'PERÍCIAS',svg:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h7m-3.5-3.5v7"/>'},{id:'abilities',label:'HABILIDADES',svg:'<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>'},{id:'items',label:'ITENS',svg:'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>'},{id:'history',label:'HISTÓRIA',svg:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'}];return `<nav class="cinematic-mobile-tabs" aria-label="Abas da ficha">${tabs.map(t=>`<button type="button" class="cinematic-mobile-tab ${cinematicMobileTab===t.id?'active':''}" data-cinematic-mobile-tab="${t.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${t.svg}</svg><span>${t.label}</span></button>`).join('')}</nav>`}
function renderCinematic(trainingOptions,bgIsVideo=false){const accent=getSheetAccent(state),profileOptions=['Executor','Analista','Vigilante'].map(value=>({value,label:value})),abilities=visibleCards('abilities').map(renderCinematicCard).join('')||'<p class="cinematic-empty">Nenhuma habilidade.</p>',items=visibleCards('items').map(renderCinematicCard).join('')||'<p class="cinematic-empty">Nenhum item.</p>',history=editMode?`<textarea class="cinematic-history" data-field="history" placeholder="História do personagem...">${safe(state.history||'')}</textarea>`:`<p class="cinematic-history-copy">${formatCardText(state.history||'Nenhuma história registrada.')}</p>`,identity=editMode?`<div class="cinematic-identity cinematic-identity-edit">${customSelect({value:state.profile,options:profileOptions,id:'profile',className:'cinematic-profile-select'})}<i></i><input class="cinematic-occupation-input" data-field="occupation" value="${safe(state.occupation)}"><i></i><span class="cinematic-level-label">NÍVEL</span><input class="cinematic-level-input" data-field="level" value="${state.level}" inputmode="numeric"></div>`:`<div class="cinematic-identity-read"><strong>${safe(state.profile)}</strong><i></i><span>${safe(state.occupation)}</span><i></i><em>NÍVEL</em><b>${state.level}</b></div>`,aptidaoOptions=APTIDAO_FIELDS.map(v=>({value:v,label:v})),aptidaoCount=state.skills.filter(s=>s.name.startsWith('APTIDÃO')).length,skillsToRender=state.skills,rightCardsHtml=`<div class="cinematic-card-column">${cinematicSection('abilities','HABILIDADES',abilities,'abilities')}${cinematicSection('items','ITENS',items,'items')}${cinematicSection('history','HISTÓRIA',history)}</div>`;return `<main class="cinematic-page cinematic-tab-${cinematicMobileTab} ${presentationMode?'presentation-active':''} ${presentationLockingIn?'presentation-locking-in':''} ${presentationEntering?'presentation-entering':''} ${editTransitionMode?`edit-trans-${editTransitionMode}`:''} ${modeJustChanged?'mode-enter':''}${bgIsVideo?' has-video-bg':''}" style="--cinematic-accent:${accent};--resource-shift:${currentResourceShift}px;--bg-blur:${state.backgroundBlur??0}px;--bg-zoom:${(state.backgroundZoom??100)/100};">${renderBackgroundLayer(bgIsVideo,true)}<div class="cinematic-frame"><i class="cinematic-frame-line top"><b></b><b></b></i><i class="cinematic-frame-line bottom"><b></b><b></b></i></div><div class="cinematic-contents"><header class="cinematic-header"><div class="cinematic-name">${editMode?`<input data-field="name" value="${safe(state.name)}">`:`<h1>${safe(state.name)}</h1>`}</div>${identity}</header>${renderCinematicMobileTabs()}<section class="cinematic-left"><div class="cinematic-attributes"><h2><span>ATRIBUTOS</span></h2>${Object.entries(state.attributes).map(([name,value])=>`<div><span>${name}</span><button class="cinematic-attribute-die" data-roll="${name}|${value}">${die(value,'cinematic-attribute')}</button>${editMode?attributeStepper(name,value):''}</div>`).join('')}</div><div class="cinematic-skills"><h2><span>PERÍCIAS</span>${editMode?`<button type="button" class="cinematic-add-aptidao" data-add-aptidao title="Adicionar outra Aptidão">+ APTIDÃO</button>`:''}</h2><div>${skillsToRender.map(skill=>{const index=state.skills.findIndex(s=>s.name===skill.name),attrDie=state.attributes[skill.attribute]||4,trained=skill.skillDie>4,isAptidao=skill.name.startsWith('APTIDÃO'),aptidaoField=isAptidao?(skill.name.match(/\(([^)]+)\)/)?.[1]||'HUMANAS'):'',nameHtml=editMode&&isAptidao?`<span class="skill-name-aptidao"><span>APTIDÃO</span>${customSelect({value:aptidaoField,options:aptidaoOptions,id:`aptidao-field:${index}`,className:'cinematic-aptidao-select'})}<i class="skill-info-button" data-skill-info="${index}">${icon('info',11)}</i>${aptidaoCount>1?`<button type="button" class="btn-remove-aptidao" data-remove-aptidao="${index}" title="Remover">${icon('trash',11)}</button>`:''}</span>`:`<span>${safe(skill.name)}<i class="skill-info-button" data-skill-info="${index}">${icon('info',11)}</i></span>`;return `<div class="cinematic-skill grade-d${skill.skillDie} ${trained?'is-trained':'is-untrained'}" data-roll="${safe(skill.name)}|${skill.skillDie},${attrDie}|${skill.extra||0}" role="button" tabindex="0">${nameHtml}<span class="cinematic-skill-dice">${die(skill.skillDie,'cinematic-skill-die',trained)}<b>+</b>${die(attrDie,'cinematic-skill-die attribute',trained)}<em>${safe(skill.attribute)}</em>${skill.extra?`<strong>${Number(skill.extra)>0?'+':''}${skill.extra}</strong>`:''}</span>${editMode?`<span class="cinematic-skill-edit">${customSelect({value:skill.training,options:trainingOptions,id:`skill-training:${index}`,className:'skill-select training-select'})}${customSelect({value:skill.attribute,options:['Físico','Mente','Emoção'].map(value=>({value,label:value})),id:`skill-attribute:${index}`,className:'skill-select attribute-select'})}<input data-skill-extra="${index}" type="number" value="${skill.extra||0}" title="Bônus extra"></span>`:''}</div>`}).join('')}</div></div></section><section class="cinematic-character" data-cinematic-character>${state.tokenImage?`<img src="${safeUrl(state.tokenImage)}" alt="${safe(state.name)}" draggable="false" data-cinematic-token style="left:${state.cinematicTokenX}%;top:${state.cinematicTokenY}%;--token-scale:${state.cinematicTokenScale/100}" class="${(state.cinematicOutlineSide==='none'||(state.cinematicOutlineIntensity??0.5)<=0||(state.cinematicOutlineWidth??1.8)<=0)?'no-outline':''}">`:`<div class="cinematic-token-empty"><span>${icon('user',54)}</span><p>ADICIONE A IMAGEM DO PERSONAGEM</p></div>`}${editMode?`<div class="cinematic-token-tools"><label>${icon('image',15)} PERSONAGEM<input id="token-upload-cinematic" type="file" accept="image/*"></label>${state.tokenImage?`<button type="button" class="btn-upscale-token" data-upscale-token title="Super-resolução e nitidez avançada">${icon('sparkles',14)} UPSCALE 2X (HD)</button>`:''}<div class="token-side-group" title="Lado da iluminação de recorte"><span>ILUMINAÇÃO</span><button type="button" class="${(state.cinematicOutlineSide||'left')==='left'?'active':''}" data-outline-side="left">ESQ</button><button type="button" class="${state.cinematicOutlineSide==='right'?'active':''}" data-outline-side="right">DIR</button><button type="button" class="${state.cinematicOutlineSide==='both'?'active':''}" data-outline-side="both">360°</button><button type="button" class="${state.cinematicOutlineSide==='none'?'active':''}" data-outline-side="none">OFF</button></div><label title="Intensidade da iluminação">FORÇA <input type="range" min="10" max="95" step="5" value="${Math.round((state.cinematicOutlineIntensity??0.5)*100)}" data-cinematic-outline-intensity></label><label title="Espessura da linha">CONTORNO <input type="range" min="0.5" max="5" step="0.2" value="${state.cinematicOutlineWidth??1.8}" data-cinematic-outline-width></label><label title="Fade / suavidade da borda">FADE <input type="range" min="0.5" max="3.5" step="0.2" value="${state.cinematicOutlineFade??1.5}" data-cinematic-outline-fade></label><label>ESCALA <input type="range" min="45" max="220" value="${state.cinematicTokenScale}" data-cinematic-scale></label><button data-reset-cinematic-token>RECENTRALIZAR</button><label>${icon('image',15)} FUNDO<input id="background-upload" type="file" accept="image/*,video/mp4,video/webm"></label>${state.backgroundImage?'<button type="button" data-reset-background>FUNDO PADRÃO</button>':''}<label title="Desfoque da imagem de fundo (Duplo clique para zerar)">BLUR <input type="range" min="0" max="30" step="1" value="${state.backgroundBlur??0}" data-cinematic-bg-blur><span class="slider-val-hint" id="val-hint-blur">${state.backgroundBlur??0}px</span></label><label title="Escala / Zoom da imagem de fundo (Duplo clique para 100%)">ZOOM BG <input type="range" min="30" max="250" step="5" value="${state.backgroundZoom??100}" data-cinematic-bg-zoom><span class="slider-val-hint" id="val-hint-zoom">${state.backgroundZoom??100}%</span></label>${(state.backgroundBlur>0||(state.backgroundZoom&&state.backgroundZoom!==100))?'<button type="button" data-reset-bg-effects title="Redefinir blur para 0 e zoom para 100%">RESET BG</button>':''}<label>COR TEMA <input type="color" data-theme-color value="${safe(getSheetAccent(state))}"></label>${state.themeColor?'<button type="button" data-reset-theme-color>TEMA DO PERFIL</button>':''}<label>COR DOS DADOS <input id="dice-color" type="color" value="${safe(state.diceColor||getSheetAccent(state))}"></label>${state.diceColor?'<button data-reset-dice-color>COR DO PERFIL</button>':''}<small>Arraste o personagem para reposicionar · Duplo clique nos sliders para redefinir</small></div>`:''}</section><section class="cinematic-right"><div class="cinematic-resources"><div class="cinematic-resource-item resource-pv" data-resource-key="pv"><strong>PV</strong><b>${state.pv}${state.pvTemp?`<button type="button" class="temp-badge-btn" data-consume-temp="pv:1" title="Clique para extinguir 1 PV temporário (Botão direito para extinguir todos)"><em>+${state.pvTemp}</em></button>`:''}</b><span>${pips(state.pv,state.maxPv,'pv',state.pvTemp)}</span>${editMode?`<small class="cinematic-resource-edit">MÁX <button data-resource-adjust="maxPv:-1">−</button>${state.maxPv}<button data-resource-adjust="maxPv:1">+</button> TEMP <button data-resource-adjust="pvTemp:-1">−</button>${state.pvTemp}<button data-resource-adjust="pvTemp:1">+</button></small>`:''}</div><div class="cinematic-resource-item resource-pd" data-resource-key="pd"><strong>PD</strong><b>${state.pd}${state.pdTemp?`<button type="button" class="temp-badge-btn" data-consume-temp="pd:1" title="Clique para extinguir 1 PD temporário (Botão direito para extinguir todos)"><em>+${state.pdTemp}</em></button>`:''}</b><span>${pips(state.pd,state.maxPd,'pd',state.pdTemp)}</span>${editMode?`<small class="cinematic-resource-edit">MÁX <button data-resource-adjust="maxPd:-1">−</button>${state.maxPd}<button data-resource-adjust="maxPd:1">+</button> TEMP <button data-resource-adjust="pdTemp:-1">−</button>${state.pdTemp}<button data-resource-adjust="pdTemp:1">+</button></small>`:''}</div></div><div class="cinematic-scroll">${rightCardsHtml}</div></section></div>${presentationMode?renderPresentationDock():''}</main>`}

function playCardSlideSound(){
 const ctx=getUiAudioContext();if(!ctx)return;
 const now=ctx.currentTime;
 try{
  const osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type='sine';
  osc.frequency.setValueAtTime(220,now);
  osc.frequency.exponentialRampToValueAtTime(80,now+0.07);
  gain.gain.setValueAtTime(0.0001,now);
  gain.gain.linearRampToValueAtTime(0.035,now+0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001,now+0.08);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);osc.stop(now+0.09);
 }catch(e){}
}

let _cachedConfirmNoise=null,_cachedOpenNoise=null,_cachedGlitchNoise=null,_cachedGlitchCurve=null;
function getConfirmNoiseBuffer(ctx){if(_cachedConfirmNoise&&_cachedConfirmNoise.sampleRate===ctx.sampleRate)return _cachedConfirmNoise;const bufferSize=Math.floor(ctx.sampleRate*0.42),buf=ctx.createBuffer(1,bufferSize,ctx.sampleRate),out=buf.getChannelData(0);for(let i=0;i<bufferSize;i++)out[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*0.16));return _cachedConfirmNoise=buf}
function getOpenNoiseBuffer(ctx){if(_cachedOpenNoise&&_cachedOpenNoise.sampleRate===ctx.sampleRate)return _cachedOpenNoise;const bufferSize=Math.floor(ctx.sampleRate*0.46),buf=ctx.createBuffer(1,bufferSize,ctx.sampleRate),out=buf.getChannelData(0);for(let i=0;i<bufferSize;i++)out[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*0.18));return _cachedOpenNoise=buf}
function getGlitchNoiseBuffer(ctx){if(_cachedGlitchNoise&&_cachedGlitchNoise.sampleRate===ctx.sampleRate)return _cachedGlitchNoise;const buf=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.42),ctx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<data.length;i++){const env=i<2000?i/2000:(i>data.length-3000?(data.length-i)/3000:1);data[i]=(Math.random()*2-1)*env*(i%1700<60?2.5:1)}return _cachedGlitchNoise=buf}
function getGlitchDistCurve(){if(_cachedGlitchCurve)return _cachedGlitchCurve;const curve=new Float32Array(256);for(let i=0;i<256;i++){const x=i/128-1;curve[i]=x*(1.2+Math.abs(x)*3.5)}return _cachedGlitchCurve=curve}

function playSelectionConfirmSound(){
 const ctx=getUiAudioContext();if(!ctx)return;
 const now=ctx.currentTime;
 const subOsc=ctx.createOscillator(),subGain=ctx.createGain();
 subOsc.type='sine';
 subOsc.frequency.setValueAtTime(82,now);
 subOsc.frequency.exponentialRampToValueAtTime(26,now+0.48);
 subGain.gain.setValueAtTime(0.0001,now);
 subGain.gain.linearRampToValueAtTime(0.48,now+0.018);
 subGain.gain.exponentialRampToValueAtTime(0.0001,now+0.58);
 subOsc.connect(subGain).connect(ctx.destination);
 subOsc.start(now);subOsc.stop(now+0.6);

 const clickOsc=ctx.createOscillator(),clickGain=ctx.createGain();
 clickOsc.type='triangle';
 clickOsc.frequency.setValueAtTime(120,now);
 clickOsc.frequency.exponentialRampToValueAtTime(38,now+0.09);
 clickGain.gain.setValueAtTime(0.0001,now);
 clickGain.gain.linearRampToValueAtTime(0.32,now+0.006);
 clickGain.gain.exponentialRampToValueAtTime(0.0001,now+0.12);
 clickOsc.connect(clickGain).connect(ctx.destination);
 clickOsc.start(now);clickOsc.stop(now+0.14);

 try{
  const noise=ctx.createBufferSource();
  noise.buffer=getConfirmNoiseBuffer(ctx);
  const filter=ctx.createBiquadFilter();
  filter.type='lowpass';
  filter.frequency.setValueAtTime(340,now);
  filter.frequency.exponentialRampToValueAtTime(55,now+0.38);
  filter.Q.setValueAtTime(2.2,now);
  const noiseGain=ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001,now);
  noiseGain.gain.linearRampToValueAtTime(0.2,now+0.02);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001,now+0.4);
  noise.connect(filter).connect(noiseGain).connect(ctx.destination);
  noise.start(now);noise.stop(now+0.42);
 }catch(e){}
}

function playUnlockSound(){
 const ctx=getUiAudioContext();if(!ctx)return;
 const now=ctx.currentTime;
 try{
  const o1=ctx.createOscillator(),g1=ctx.createGain();
  o1.type='triangle';o1.frequency.setValueAtTime(2400,now);
  o1.frequency.exponentialRampToValueAtTime(1100,now+0.025);
  g1.gain.setValueAtTime(0.0001,now);
  g1.gain.linearRampToValueAtTime(0.12,now+0.004);
  g1.gain.exponentialRampToValueAtTime(0.0001,now+0.04);
  o1.connect(g1).connect(ctx.destination);
  o1.start(now);o1.stop(now+0.045);

  const o2=ctx.createOscillator(),g2=ctx.createGain();
  o2.type='sine';o2.frequency.setValueAtTime(1600,now+0.045);
  o2.frequency.exponentialRampToValueAtTime(420,now+0.13);
  g2.gain.setValueAtTime(0.0001,now+0.045);
  g2.gain.linearRampToValueAtTime(0.16,now+0.05);
  g2.gain.exponentialRampToValueAtTime(0.0001,now+0.15);
  o2.connect(g2).connect(ctx.destination);
  o2.start(now+0.045);o2.stop(now+0.16);
 }catch(e){}
}

function playLockRattleSound(){
 const ctx=getUiAudioContext();if(!ctx)return;
 const now=ctx.currentTime;
 try{
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type='square';o.frequency.setValueAtTime(320,now);
  o.frequency.setValueAtTime(460,now+0.02);
  o.frequency.setValueAtTime(240,now+0.045);
  g.gain.setValueAtTime(0.0001,now);
  g.gain.linearRampToValueAtTime(0.04,now+0.005);
  g.gain.exponentialRampToValueAtTime(0.0001,now+0.07);
  o.connect(g).connect(ctx.destination);
  o.start(now);o.stop(now+0.08);
 }catch(e){}
}

function playPresentationOpenSound(){
 const ctx=getUiAudioContext();if(!ctx)return;
 const now=ctx.currentTime;
 try{
  const subOsc=ctx.createOscillator(),subGain=ctx.createGain();
  subOsc.type='sine';
  subOsc.frequency.setValueAtTime(32,now);
  subOsc.frequency.exponentialRampToValueAtTime(74,now+0.22);
  subOsc.frequency.exponentialRampToValueAtTime(36,now+0.52);
  subGain.gain.setValueAtTime(0.0001,now);
  subGain.gain.linearRampToValueAtTime(0.42,now+0.03);
  subGain.gain.exponentialRampToValueAtTime(0.0001,now+0.56);
  subOsc.connect(subGain).connect(ctx.destination);
  subOsc.start(now);subOsc.stop(now+0.58);

  const clickOsc=ctx.createOscillator(),clickGain=ctx.createGain();
  clickOsc.type='triangle';
  clickOsc.frequency.setValueAtTime(42,now);
  clickOsc.frequency.exponentialRampToValueAtTime(135,now+0.08);
  clickGain.gain.setValueAtTime(0.0001,now);
  clickGain.gain.linearRampToValueAtTime(0.28,now+0.01);
  clickGain.gain.exponentialRampToValueAtTime(0.0001,now+0.12);
  clickOsc.connect(clickGain).connect(ctx.destination);
  clickOsc.start(now);clickOsc.stop(now+0.14);

  const noise=ctx.createBufferSource();
  noise.buffer=getOpenNoiseBuffer(ctx);
  const filter=ctx.createBiquadFilter();
  filter.type='lowpass';
  filter.frequency.setValueAtTime(95,now);
  filter.frequency.exponentialRampToValueAtTime(380,now+0.2);
  filter.frequency.exponentialRampToValueAtTime(70,now+0.42);
  filter.Q.setValueAtTime(2.4,now);
  const noiseGain=ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001,now);
  noiseGain.gain.linearRampToValueAtTime(0.22,now+0.03);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001,now+0.44);
  noise.connect(filter).connect(noiseGain).connect(ctx.destination);
  noise.start(now);noise.stop(now+0.46);
 }catch(e){}
}

function getPresentationSheets(){
 return visibleSheets(sheets,folders,{apenasPersonagens:true});
}

let presentationDirection=0;
function openPresentationMode(){
 if(presentationLockingIn)return;
 const presSheets=getPresentationSheets();
 if(!presSheets.length)return;
 presentationIndex=Math.max(0,presSheets.findIndex(s=>s.id===state.id));
 presentationMode=true;
 presentationEntering=true;
 presentationLockingIn=false;
 presentationDirection=0;
 state=presSheets[presentationIndex];
 state.viewMode='cinematic';
 activeSheetId=state.id;
 playPresentationOpenSound();
 render();
 setTimeout(()=>{
  presentationEntering=false;
  const page=document.querySelector('.cinematic-page');
  if(page)page.classList.remove('presentation-entering');
 },560);
}
function closePresentationMode(){
 if(presentationLockingIn)return;
 const presSheets=getPresentationSheets();
 confirmPresentationAgent(presSheets[presentationIndex]||presSheets[0]);
}
function cyclePresentation(direction){
 const presSheets=getPresentationSheets();
 if(presentationLockingIn||presSheets.length<=1)return;
 presentationDirection=direction;
 presentationIndex=(presentationIndex+direction+presSheets.length)%presSheets.length;
 triggerGlitchTransition(()=>{
  state=presSheets[presentationIndex];
  state.viewMode='cinematic';
  activeSheetId=state.id;
  render();
 });
}

function confirmPresentationAgent(chosenSheet){
 if(!chosenSheet||presentationLockingIn)return;
 presentationLockingIn=true;
 playSelectionConfirmSound();
 playUnlockSound();
 const page=document.querySelector('.cinematic-page');
 const currCard=document.querySelector('[data-presentation-curr]');
 if(page)page.classList.add('presentation-locking-in');
 if(currCard)currCard.classList.add('locking-in');
 const thumb=currCard?.querySelector('.cp-card-thumb');
 if(thumb&&!thumb.querySelector('.pcard-lockin-overlay')){
  const overlay=document.createElement('div');
  overlay.className='pcard-lockin-overlay';
  overlay.innerHTML=`<div class="pcard-lockin-stamp"><strong>✓ RECEPTÁCULO CONFIRMADO</strong><small>SINCRONIZANDO FICHA...</small></div>`;
  thumb.appendChild(overlay);
 }
 setTimeout(()=>{
  presentationLockingIn=false;
  presentationMode=false;
  editMode=false;
  state=chosenSheet;
  activeSheetId=state.id;
  state.viewMode='cinematic';
  if(state.cinematicCollapsed){
   state.cinematicCollapsed.items=true;
   state.cinematicCollapsed.history=true;
   state.cinematicCollapsed.abilities=false;
  }
  save(false);
  render();
 },540);
}

function renderPresentationDock(){
 const presSheets=getPresentationSheets();
 const total=presSheets.length;
 if(!total)return '';
 const matchedIdx=presSheets.findIndex(s=>s.id===state?.id);
 if(matchedIdx>=0)presentationIndex=matchedIdx;
 else presentationIndex=((presentationIndex%total)+total)%total;
 const prevIdx=(presentationIndex-1+total)%total,currIdx=presentationIndex,nextIdx=(presentationIndex+1+total)%total;
 const prevSheet=presSheets[prevIdx],currSheet=presSheets[currIdx],nextSheet=presSheets[nextIdx];
 const prevAccent=getSheetAccent(prevSheet);
 const currAccent=getSheetAccent(currSheet);
 const nextAccent=getSheetAccent(nextSheet);
 const hasMultiple=total>1;
 const dirClass=presentationDirection===1?'dir-next':(presentationDirection===-1?'dir-prev':'');

 const renderPills = (s) => {
  if(s.systemMode === 'original'){
   const pvM = s.maxPv || originalCalcPvMax(s);
   const sanM = s.maxSan || originalCalcSanMax(s);
   const peM = s.maxPe || originalCalcPeMax(s);
   const a = s.atributos || { agi: 1, for: 1, int: 1, pre: 1, vig: 1 };
   return `<span class="cp-stat-pill">AGI <b>${a.agi}</b></span><span class="cp-stat-pill">FOR <b>${a.for}</b></span><span class="cp-stat-pill">INT <b>${a.int}</b></span><span class="cp-stat-pill">PRE <b>${a.pre}</b></span><span class="cp-stat-pill">VIG <b>${a.vig}</b></span><span class="cp-res-pill pv">PV ${s.pv??pvM}/${pvM}</span>${s.usaPD?`<span class="cp-res-pill pd">PD ${s.pe??peM}/${peM}</span>`:`<span class="cp-res-pill san">SAN ${s.san??sanM}/${sanM}</span><span class="cp-res-pill pe">PE ${s.pe??peM}/${peM}</span>`}`;
  }
  return `<span class="cp-stat-pill">FÍS <b>${s.attributes?.['Físico']||4}</b></span><span class="cp-stat-pill">MEN <b>${s.attributes?.['Mente']||4}</b></span><span class="cp-stat-pill">EMO <b>${s.attributes?.['Emoção']||4}</b></span><span class="cp-res-pill pv">PV ${s.pv}/${s.maxPv}</span><span class="cp-res-pill pd">PD ${s.pd}/${s.maxPd}</span>`;
 };

 const getSub = (s) => s.systemMode === 'original' ? `${safe(classeAtual(s).nome)} · ${rotuloNivel(s)}` : `${safe(s.occupation||'Investigador')} · ${safe(s.profile)}`;
 const getProfileTag = (s) => s.systemMode === 'original' ? 'ORDEM RPG' : safe(s.profile);
 const getLevelTag = (s) => s.systemMode === 'original' ? rotuloNivel(s).toUpperCase() : `NV ${s.level||1}`;

 return `<section class="cinematic-presentation-dock" style="--agent-accent:${currAccent}"><header class="cp-dock-top"><span class="cp-dock-badge">${icon('dossier',11)} SELEÇÃO DE RECEPTÁCULO</span><span class="cp-dock-hint"><kbd>←</kbd> <kbd>→</kbd> Navegar · <b>Duplo clique</b> para Confirmar</span><span class="cp-dock-counter">${currIdx+1} / ${total}</span></header><div class="cp-dock-carousel ${dirClass}" id="presentation-stage" style="--prev-accent:${prevAccent};--curr-accent:${currAccent};--next-accent:${nextAccent};">${hasMultiple?`<button type="button" class="cp-arrow prev" data-presentation-prev title="Receptáculo anterior (←)">${icon('chevron-left',18)}</button><article class="cp-card card-side card-prev" data-presentation-pick="${prevIdx}" style="--agent-accent:${prevAccent}" title="Ver ${safe(prevSheet.name)}"><div class="cp-card-topbar"><span class="cp-card-tag">ANTERIOR</span><span class="cp-card-profile ${prevSheet.systemMode==='original'?'original':''}">${getProfileTag(prevSheet)}</span></div><div class="cp-card-thumb">${prevSheet.tokenImage?`<img src="${safeUrl(prevSheet.tokenImage)}" alt="${safe(prevSheet.name)}">`:`<div class="cp-avatar-ph">${safe((prevSheet.name||'?').slice(0,1))}</div>`}</div><div class="cp-card-summary"><strong>${safe(prevSheet.name)}</strong><small>${getSub(prevSheet)}</small></div></article>`:''}<article class="cp-card card-curr ${presentationLockingIn?'locking-in':''}" data-presentation-curr style="--agent-accent:${currAccent}"><div class="cp-card-topbar"><span class="cp-card-tag" title="Duplo clique para confirmar receptáculo">DUPLO CLIQUE PARA CONFIRMAR</span><span class="cp-card-profile ${currSheet.systemMode==='original'?'original':''}">${getProfileTag(currSheet)}</span></div><div class="cp-card-thumb">${currSheet.tokenImage?`<img src="${safeUrl(currSheet.tokenImage)}" alt="${safe(currSheet.name)}">`:`<div class="cp-avatar-ph">${safe((currSheet.name||'?').slice(0,1))}</div>`}${presentationLockingIn?`<div class="pcard-lockin-overlay"><div class="pcard-lockin-stamp"><strong>✓ RECEPTÁCULO CONFIRMADO</strong><small>SINCRONIZANDO FICHA...</small></div></div>`:''}</div><div class="cp-card-summary"><div class="cp-summary-header"><strong>${safe(currSheet.name)}</strong><span class="cp-level-badge">${getLevelTag(currSheet)}</span></div><small>${getSub(currSheet)}</small><div class="cp-pill-row ${currSheet.systemMode==='original'?'original-pills':''}">${renderPills(currSheet)}</div><button type="button" class="btn-select-cp-agent" data-confirm-agent="${currSheet.id}" title="Confirmar receptáculo (Duplo clique ou Enter)"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg><span>CONFIRMAR RECEPTÁCULO</span></button></div></article>${hasMultiple?`<article class="cp-card card-side card-next" data-presentation-pick="${nextIdx}" style="--agent-accent:${nextAccent}" title="Ver ${safe(nextSheet.name)}"><div class="cp-card-topbar"><span class="cp-card-tag">PRÓXIMO</span><span class="cp-card-profile ${nextSheet.systemMode==='original'?'original':''}">${getProfileTag(nextSheet)}</span></div><div class="cp-card-thumb">${nextSheet.tokenImage?`<img src="${safeUrl(nextSheet.tokenImage)}" alt="${safe(nextSheet.name)}">`:`<div class="cp-avatar-ph">${safe((nextSheet.name||'?').slice(0,1))}</div>`}</div><div class="cp-card-summary"><strong>${safe(nextSheet.name)}</strong><small>${getSub(nextSheet)}</small></div></article><button type="button" class="cp-arrow next" data-presentation-next title="Próximo receptáculo (→)">${icon('chevron-right',18)}</button>`:''}</div></section>`;
}

function bindPresentationEvents(){
 document.querySelectorAll('[data-open-presentation]').forEach(btn=>btn.onclick=()=>{
  sheetDrawerOpen=false;
  viewSwitchCollapsed=true;
  openPresentationMode();
 });
 document.querySelectorAll('[data-close-presentation]').forEach(btn=>btn.onclick=()=>closePresentationMode());
 document.querySelectorAll('[data-presentation-prev]').forEach(btn=>btn.onclick=()=>cyclePresentation(-1));
 document.querySelectorAll('[data-presentation-next]').forEach(btn=>btn.onclick=()=>cyclePresentation(1));
 document.querySelectorAll('[data-presentation-pick]').forEach(card=>{
  card.onclick=e=>{
   e.stopPropagation();
   if(presentationLockingIn)return;
   const presSheets=getPresentationSheets();
   const idx=Number(card.dataset.presentationPick);
   if(!isNaN(idx)){
    if(card.classList.contains('card-next'))cyclePresentation(1);
    else if(card.classList.contains('card-prev'))cyclePresentation(-1);
    else{
     const diff=(idx-presentationIndex+presSheets.length)%presSheets.length;
     cyclePresentation(diff===1?1:-1);
    }
   }
  };
 });
 document.querySelectorAll('[data-confirm-agent]').forEach(btn=>{
  btn.onclick=e=>{
   e.stopPropagation();
   const presSheets=getPresentationSheets();
   const id=btn.dataset.confirmAgent,target=presSheets.find(s=>s.id===id)||presSheets[presentationIndex];
   confirmPresentationAgent(target);
  };
 });
 const currCard=document.querySelector('[data-presentation-curr]');
 if(currCard){
  currCard.ondblclick=e=>{
   e.stopPropagation();
   const presSheets=getPresentationSheets();
   confirmPresentationAgent(presSheets[presentationIndex]);
  };
 }
 const stage=document.querySelector('#presentation-stage');
 if(stage){
  let tStartX=0,tStartY=0,tStartTime=0;
  stage.ontouchstart=e=>{
   if(presentationLockingIn)return;
   const t=e.touches[0];
   tStartX=t.clientX;tStartY=t.clientY;tStartTime=Date.now();
  };
  stage.ontouchend=e=>{
   if(presentationLockingIn||!tStartTime)return;
   const t=e.changedTouches[0],dx=t.clientX-tStartX,dy=t.clientY-tStartY,dt=Date.now()-tStartTime;
   tStartTime=0;
   if(dt<400&&Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.2){
    if(dx<0)cyclePresentation(1);else cyclePresentation(-1);
   }
  };
 }
}


function readMedia(file,key){if(!file)return;const type=file.type;if(type.startsWith('video/')||type==='image/gif'){if(state[key]?.startsWith('blob:'))URL.revokeObjectURL(state[key]);blobBgType=type.startsWith('video/')?'video':'gif';state[key]=URL.createObjectURL(file);render()}else{blobBgType='';readImage(file,key,1920)}}


function renderBottomNav(){
 if(presentationMode) return '';
 const isCinematic=state.viewMode==='cinematic';
 const tabs=isCinematic?[
  {id:'skills',label:'DADOS',svg:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h7m-3.5-3.5v7"/>'},
  {id:'abilities',label:'HABILIDADES',svg:'<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>'},
  {id:'items',label:'ITENS',svg:'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>'},
  {id:'history',label:'HISTÓRIA',svg:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'},
 ]:[
  {id:'agent',label:'AGENTE',svg:'<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M3 21a9 9 0 0 1 18 0"/>'},
  {id:'stats',label:'STATS',svg:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h7m-3.5-3.5v7"/>'},
  {id:'cards',label:'CARTAS',svg:'<rect x="2" y="3" width="13" height="18" rx="2"/><path d="M16 8h4m-2-2v4M16 16h4"/>'},
  {id:'history',label:'HISTÓRIA',svg:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'},
 ];
 const activeId=isCinematic?cinematicMobileTab:mobileTab;
 const tabAttr=isCinematic?'data-cinematic-mobile-tab':'data-mobile-tab';
 return `<nav class="mobile-bottom-nav">
  <button class="mobile-drawer-btn" data-sheet-drawer aria-label="Fichas">${state.tokenImage?`<img src="${safeUrl(state.tokenImage)}" alt="" class="mobile-avatar-thumb">`:icon('sheet',20)}</button>
  ${tabs.map(t=>`<button class="mobile-tab-btn ${activeId===t.id?'active':''}" ${tabAttr}="${t.id}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${t.svg}</svg><span>${t.label}</span></button>`).join('')}
  <button class="mobile-tab-btn btn-mobile-roll-log" data-open-roll-log aria-label="Histórico">${icon('history',20)}<span>ROLAGENS</span></button>
  <button class="mobile-tab-btn ${editMode?'active edit-active':''}" data-toggle-edit aria-label="Editar">${editMode?icon('close',20):icon('edit',20)}<span>${editMode?'FECHAR':'EDITAR'}</span></button>
 </nav>`;
}

function renderMobileOrientationPrompt(){
 return `<aside class="mobile-orientation-prompt" role="dialog" aria-modal="true" aria-labelledby="orientation-prompt-title" aria-describedby="orientation-prompt-copy">
  <div class="orientation-visual" aria-hidden="true">
   <span class="orientation-orbit"></span>
   <span class="orientation-phone"><i></i></span>
  </div>
  <small>FICHA CINEMATOGRÁFICA</small>
  <h2 id="orientation-prompt-title">GIRE PARA PAISAGEM</h2>
  <p id="orientation-prompt-copy">Esta visualização foi criada para a tela horizontal. Gire o celular para ver a ficha inteira.</p>
  <button type="button" data-request-landscape>${icon('frame',16)} <span>ATIVAR TELA CHEIA</span></button>
  <button type="button" class="orientation-install" data-install-app ${deferredInstallPrompt?'':'hidden'}>${icon('download',16)} <span>INSTALAR COMO APP</span></button>
  <em data-orientation-status>O aviso desaparecerá automaticamente ao girar.</em>
 </aside>`;
}

function syncMobilePresentationViewport(){
 const viewport=window.visualViewport,width=Math.round(viewport?.width||window.innerWidth),height=Math.round(viewport?.height||window.innerHeight);
 const touchDevice=(navigator.maxTouchPoints||0)>0||window.matchMedia?.('(pointer: coarse)').matches;
 const cinematic=state?.viewMode==='cinematic';
 document.documentElement.style.setProperty('--mobile-viewport-width',`${width}px`);
 document.documentElement.style.setProperty('--mobile-viewport-height',`${height}px`);
 document.body.classList.toggle('mobile-cinematic',touchDevice&&cinematic);
 document.body.classList.toggle('mobile-cinematic-landscape',touchDevice&&cinematic&&width>height);
 document.body.classList.toggle('mobile-cinematic-compact',touchDevice&&cinematic&&width>height&&height<360);
 document.body.classList.toggle('mobile-cinematic-tight',touchDevice&&cinematic&&width>height&&height<310);
 document.body.classList.toggle('orientation-prompt-active',touchDevice&&cinematic&&height>=width);
}

async function requestLandscapePresentation(){
 const button=document.querySelector('[data-request-landscape]'),status=document.querySelector('[data-orientation-status]');
 if(button)button.disabled=true;
 if(status)status.textContent='Preparando a visualização horizontal…';
 let locked=false;
 try{
  if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen({navigationUI:'hide'});
 }catch{}
 try{
  if(screen.orientation?.lock){await screen.orientation.lock('landscape');locked=true}
 }catch{}
 syncMobilePresentationViewport();
 if(status&&!locked&&document.body.classList.contains('orientation-prompt-active'))status.textContent='Gire o aparelho manualmente para continuar.';
 if(button&&!locked)button.disabled=false;
}

async function requestAppInstall(){
 if(!deferredInstallPrompt)return;
 const prompt=deferredInstallPrompt;
 deferredInstallPrompt=null;
 await prompt.prompt();
 await prompt.userChoice.catch(()=>null);
 document.querySelector('[data-install-app]')?.setAttribute('hidden','');
}

function renderSheetDrawer(){
 if(!sheetDrawerOpen)return'';
 return `<div class="sheet-drawer-backdrop" data-close-drawer></div>
 <aside class="sheet-drawer">
  <div class="sheet-drawer-header"><span>FICHAS</span><button data-close-drawer>${icon('close',16)}</button></div>
  <div class="sheet-drawer-list">
   ${sheets.map(sheet=>`<button class="sheet-drawer-item ${sheet.id===state.id?'active':''}" data-sheet-id="${sheet.id}">${sheet.tokenImage?`<img src="${safeUrl(sheet.tokenImage)}" alt="">`:''}<span>${safe(sheet.name||'AGENTE')}</span></button>`).join('')}
   <button class="sheet-drawer-item new" data-new-sheet>${icon('plus',16)}<span>NOVA FICHA</span></button>
  </div>
  <div class="sheet-drawer-footer">
    <button type="button" data-open-presentation>${icon('presentation',15)} APRESENTAÇÃO</button>
    <button type="button" data-export-cinematic-image>${icon('camera',15)} FOTO HD</button>
    <button type="button" data-open-roll-log>${icon('history',15)} LOG (${rollLog.length})</button>
   <button data-export-json>${icon('download',15)} EXPORTAR</button>
   <button data-import-json>${icon('upload',15)} IMPORTAR</button>
   <button data-save-sheet>${icon('save',15)} SALVAR</button>
   <input type="file" id="json-file-input" accept=".json,application/json" style="display:none">
  </div>
 </aside>`;
}

let rollLog = [];
try {
 const saved = sessionStorage.getItem('ordem-ii-roll-log');
 if (saved) rollLog = JSON.parse(saved);
} catch {}
let rollLogOpen = false;

function addRollLogEntry(entry) {
 const d = new Date();
 const timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
 rollLog.unshift({
  id: makeId('roll'),
  characterName: state.name || (state.systemMode === 'threat' ? 'Ameaça' : 'Agente'),
  accent: getSheetAccent(state),
  profile: state.systemMode === 'threat' ? (state.elementos?.[0] || 'Ameaça') : (state.profile || 'Executor'),
  title: entry.title || 'Rolagem',
  dice: entry.dice || [],
  modifier: Number(entry.modifier) || 0,
  total: entry.total,
  rollMode: entry.rollMode,
  timestamp: timeStr
 });
 if (rollLog.length > 50) rollLog.length = 50;
 try { sessionStorage.setItem('ordem-ii-roll-log', JSON.stringify(rollLog)); } catch {}
 updateRollLogUi();
}

function updateRollLogUi() {
 document.querySelectorAll('.roll-log-badge').forEach(badge => {
  badge.textContent = rollLog.length ? String(rollLog.length) : '';
  badge.classList.toggle('visible', rollLog.length > 0);
 });
 const body = document.querySelector('#roll-log-body');
 if (body) {
  body.innerHTML = renderRollLogItemsHtml();
  bindRollLogItemEvents(body);
 }
 const countEl = document.querySelector('#roll-log-count');
 if (countEl) {
  countEl.textContent = `${rollLog.length} ${rollLog.length === 1 ? 'rolagem' : 'rolagens'} registradas`;
 }
}

function renderRollLogItemsHtml() {
 if (!rollLog.length) {
  return `<div class="roll-log-empty">
   <div class="roll-log-empty-icon">${icon('d20', 36)}</div>
   <h4>NENHUMA ROLAGEM AINDA</h4>
   <p>Role atributos, perícias ou ações para registrar o histórico nesta sessão.</p>
  </div>`;
 }
 return rollLog.map(entry => {
  const modStr = entry.modifier ? ` ${entry.modifier > 0 ? '+' : '−'} ${Math.abs(entry.modifier)}` : '';
  const isAdvantage = entry.rollMode === 'highest' || entry.rollMode === 'lowest';
  const diceStr = (entry.dice || []).map(d => {
   const cls = d.dread ? 'dread' : (d.destroyed ? 'destroyed discarded' : (d.isChosen ? 'chosen' : (d.discarded ? 'discarded' : '')));
   const pillTitle = d.dread ? ' title="Dado de Pavor"' : (d.destroyed ? ' title="Destruído pelo Pavor"' : '');
   return `<span class="roll-die-pill ${cls}" data-sides="${d.sides}"${pillTitle}><b>${d.dread ? '☠' : ''}${d.value}</b><small>d${d.sides}</small></span>`;
  }).join(isAdvantage ? '<i class="roll-plus">,</i>' : '<i class="roll-plus">+</i>');
  const accentColor = entry.accent || PROFILE_COLORS[entry.profile] || ORIGINAL_CLASS_COLORS[entry.profile?.toLowerCase()] || '#e0150d';
  const copyText = `🎲 [${entry.characterName}] ${entry.title}: ${entry.total} (${(entry.dice || []).map(d => `d${d.sides}:${d.value}`).join(', ')}${modStr})`;
  return `<article class="roll-log-item" style="--item-accent:${accentColor}">
   <div class="roll-log-item-top">
    <div class="roll-log-agent">
     <span class="roll-log-char-name">${safe(entry.characterName)}</span>
     <span class="roll-log-time">${entry.timestamp}</span>
    </div>
    <button type="button" class="btn-copy-single-roll" data-copy-roll="${safe(copyText)}" title="Copiar para Discord/WhatsApp">${icon('copy', 13)}</button>
   </div>
   <div class="roll-log-item-middle">
    <h4 class="roll-log-item-title">${safe(entry.title)}</h4>
    <div class="roll-log-total"><b>${entry.total}</b></div>
   </div>
   <div class="roll-log-item-breakdown">
    ${diceStr}
    ${entry.modifier ? `<span class="roll-mod-pill">${entry.modifier > 0 ? '+' : '−'}${Math.abs(entry.modifier)}</span>` : ''}
   </div>
  </article>`;
 }).join('');
}

function renderRollLogDrawer() {
 return `
 <div class="roll-log-backdrop ${rollLogOpen ? 'open' : ''}" data-close-roll-log></div>
 <aside class="roll-log-drawer ${rollLogOpen ? 'open' : ''}">
  <header class="roll-log-header">
   <div class="roll-log-header-title">
    <span class="roll-log-icon">${icon('d20', 18)}</span>
    <div>
     <h3>HISTÓRICO DE ROLAGENS</h3>
     <small id="roll-log-count">${rollLog.length} ${rollLog.length === 1 ? 'rolagem' : 'rolagens'} registradas</small>
    </div>
   </div>
   <div class="roll-log-header-actions">
    ${rollLog.length ? `<button type="button" class="btn-log-action" data-copy-all-rolls title="Copiar todo o histórico">${icon('copy', 13)}<span>COPIAR</span></button><button type="button" class="btn-log-action" data-clear-roll-log title="Limpar histórico">${icon('trash', 13)}</button>` : ''}
    <button type="button" class="btn-close-roll-log" data-close-roll-log title="Fechar">${icon('close', 16)}</button>
   </div>
  </header>
  <div class="roll-log-body" id="roll-log-body">
   ${renderRollLogItemsHtml()}
  </div>
 </aside>`;
}

function toggleRollLog(force) {
 rollLogOpen = (typeof force === 'boolean') ? force : !rollLogOpen;
 const drawer = document.querySelector('.roll-log-drawer');
 const backdrop = document.querySelector('.roll-log-backdrop');
 if (drawer && backdrop) {
  drawer.classList.toggle('open', rollLogOpen);
  backdrop.classList.toggle('open', rollLogOpen);
 }
}

function bindRollLogItemEvents(container = document) {
 container.querySelectorAll('[data-copy-roll]').forEach(btn => {
  btn.onclick = e => {
   e.stopPropagation();
   const text = btn.dataset.copyRoll;
   if (text) {
    navigator.clipboard.writeText(text).catch(() => {});
    const toast = document.querySelector('#save-toast');
    if (toast) {
     toast.textContent = 'ROLAGEM COPIADA!';
     toast.classList.add('show');
     setTimeout(() => { toast.classList.remove('show'); toast.textContent = 'SALVO'; }, 1300);
    }
   }
  };
 });
}

function render(){syncDraftBaseline();syncUnsavedBar();document.querySelectorAll('.cinematic-ghost-exit').forEach(el=>el.remove());document.body.classList.toggle('navigator-pinned',Boolean(sidebarNavigatorPinned&&sidebarNavigatorOpen));const isCinematic=(presentationMode||state.viewMode==='cinematic')&&state.systemMode!=='threat';const previousScroll={sheet:app.querySelector('.sheet-main')?.scrollTop||0,right:app.querySelector('.right-panel')?.scrollTop||0,traditionalPage:app.querySelector('.traditional-dossier-page')?.scrollTop||0,threatPage:app.querySelector('.threat-book-page')?.scrollTop||0,cinematicRight:app.querySelector('.cinematic-scroll')?.scrollTop||0,cinematicSkills:app.querySelector('.cinematic-skills>div')?.scrollTop||0,sheetSwitcher:app.querySelector('.sheet-switcher')?.scrollTop||0,vigiliaSkills:app.querySelector('.vigilia-skills-table')?.scrollTop||0};applyTheme();const bgIsVideo=!!(state.backgroundImage&&state.backgroundImage.startsWith('data:video/'));const trainingOptions=TRAINING.map(([label,value])=>({value:label,label,html:`${die(value,'menu-die',value>4)}<span>d${value} — ${label}</span>`})),aptidaoOptions=APTIDAO_FIELDS.map(value=>({value,label:value})),aptidaoCount=Array.isArray(state.skills)?state.skills.filter(s=>s.name.startsWith('APTIDÃO')).length:0;app.innerHTML=`

	  <aside class="nav-rail compact-rail"><button class="nav-btn active main-sheet-icon" title="Ficha principal">${state.tokenImage?`<img src="${safeUrl(state.tokenImage)}" alt="" draggable="false">`:icon('sheet')}</button><button type="button" class="nav-btn ${sidebarNavigatorOpen?'active':''}" data-toggle-navigator title="Navegador de pastas e fichas">${icon('folder',18)}</button><button class="nav-btn" ${state.systemMode==='original'?'data-open-compendium title="Compêndio"':'data-compendium title="Compêndio (em breve)"'}>${icon('book')}</button><button type="button" class="nav-btn" data-open-presentation title="Modo de Apresentação / Seleção de Agentes (Dossiês)">${icon('presentation',18)}</button><button type="button" class="nav-btn btn-nav-roll-log" data-open-roll-log title="Histórico de rolagens (H)">${icon('history',18)}<span class="roll-log-badge ${rollLog.length?'visible':''}" id="nav-roll-badge">${rollLog.length||''}</span></button><div class="nav-separator"></div>${renderRailScopePills(sidebarScope,sheets)}${renderRailSwitcher(sheets,folders,state.id,{scope:sidebarScope,visibleFolderIds:appSettings.sidebarVisibleFolderIds,threatElement:threatFilterElement,threatVdRange:threatFilterVdRange,threatVdMin:threatFilterVdMin,threatVdMax:threatFilterVdMax,threatCategory:threatFilterCategory,threatSort:threatSort,safeUrl})}<span class="nav-spacer"></span><button class="nav-btn" data-export-cinematic-image title="Exportar imagem da ficha cinematográfica (PNG HD)">${icon('camera')}</button><button class="nav-btn" data-export-json title="Exportar ficha em JSON">${icon('download')}</button><button class="nav-btn" data-import-json title="Importar ficha em JSON">${icon('upload')}</button><input type="file" id="json-file-input" accept=".json,application/json" style="display:none"><button class="nav-btn" data-save-sheet title="Salvar ficha (disco e navegador)">${icon('save')}</button><button class="nav-btn" data-critical-settings title="Configurar efeitos críticos">${icon('settings')}</button></aside>

   ${renderWorkspaceNavigator(folders,sheets,state.id,{open:sidebarNavigatorOpen,pinned:sidebarNavigatorPinned,searchQuery:sidebarSearchQuery,scope:sidebarScope,visibleFolderIds:appSettings.sidebarVisibleFolderIds,recentSheetIds:appSettings.recentSheetIds,threatElement:threatFilterElement,threatVdRange:threatFilterVdRange,threatVdMin:threatFilterVdMin,threatVdMax:threatFilterVdMax,threatCategory:threatFilterCategory,threatSort:threatSort,threatGroupBy:threatGroupBy,threatFiltersOpen:threatFiltersOpen,virtualGroupsCollapsed:virtualGroupsCollapsed,safeUrl})}
   ${quickSwitcherOpen?renderQuickSwitcherModal(sheets,folders,quickSwitcherQuery,quickSwitcherIndex,safeUrl):''}

  ${state.systemMode==='threat'
    ? renderThreatBook(state, editMode, { safeUrl, renderBackgroundLayer })
    : (state.systemMode==='original'
        ? (isCinematic?renderCinematicOriginal(state,editMode,{safeUrl,renderBackgroundLayer,presentationMode,renderPresentationDock,die,accent:getSheetAccent(state),resourceShift:currentResourceShift,pageClass:`cinematic-tab-${cinematicMobileTab} ${presentationMode?'presentation-active':''} ${presentationLockingIn?'presentation-locking-in':''} ${presentationEntering?'presentation-entering':''} ${editTransitionMode?`edit-trans-${editTransitionMode}`:''} ${modeJustChanged?'mode-enter':''}`}):renderTraditionalOriginal(state,editMode,{accent:getSheetAccent(state),currentRight:currentOriginalTab,filterQuery:originalSkillsFilter,safeUrl,renderBackgroundLayer}))
        : (state.viewMode==='vigilia'
            ? renderVigiliaSheet(state, editMode, { safeUrl, renderBackgroundLayer, modeJustChanged, customSelect, aptidaoOptions, renderMarker })
            : (isCinematic?renderCinematic(trainingOptions,bgIsVideo):renderTraditional(trainingOptions,bgIsVideo,aptidaoOptions,aptidaoCount)))
    )
  }
	 ${(isCinematic || state.viewMode === 'vigilia')?renderCriticalAtmosphere():''}
	 ${state.systemMode==='threat'?'':`<div class="view-mode-switch ${viewSwitchCollapsed?'collapsed':'expanded'}">${viewSwitchCollapsed?`<button type="button" class="view-mode-trigger" data-toggle-view-switch title="Alternar modo de exibição (Clique para expandir)">${state.viewMode==='vigilia'?icon('shield',14):(isCinematic?icon('film',14):icon('grid',14))}<span>${state.viewMode==='vigilia'?'VIGÍLIA':(isCinematic?'CINEMA':'PADRÃO')}</span><i class="switch-arrow">▾</i></button>`:`<button type="button" class="${state.viewMode==='traditional'&&!presentationMode?'active':''}" data-display-mode="traditional">${icon('grid',14)}<span>TRADICIONAL</span></button><button type="button" class="${isCinematic&&!presentationMode?'active':''}" data-display-mode="cinematic">${icon('film',14)}<span>CINEMATOGRÁFICO</span></button><button type="button" class="${state.viewMode==='vigilia'?'active':''}" data-display-mode="vigilia">${icon('shield',14)}<span>A VIGÍLIA</span></button><button type="button" class="${presentationMode?'active':''}" data-open-presentation title="Modo de Apresentação">${icon('presentation',14)}<span>APRESENTAÇÃO</span></button><button type="button" class="btn-collapse-switch" data-toggle-view-switch title="Recolher menu">${icon('chevron',12)}</button>`}</div>`}
  ${editMode?`<div class="edit-status active"><span></span>MODO DE EDIÇÃO — TEMA ÂMBAR</div>`:''}<div class="floating"><button class="${editMode?'active':''}" data-toggle-edit title="${editMode?'Fechar edição':'Editar ficha'}">${editMode?icon('close'):icon('edit')}</button></div><div class="save-toast" id="save-toast">SALVO</div>

  <div id="dice-stage"><canvas id="dice-canvas"></canvas><div id="dice-stage-result"></div></div>
	 <div class="modal skill-info-modal" id="skill-info-modal"><div class="backdrop skill-info-backdrop"></div><section><button class="skill-info-close">${icon('close')}</button><small>PERÍCIA</small><h2 id="skill-info-title"></h2><p id="skill-info-copy"></p><footer id="skill-info-attribute"></footer></section></div>
	 ${renderCriticalSettings()}
  <div class="modal slot-fill-modal" id="slot-fill-modal"><div class="backdrop slot-fill-backdrop"></div><section><button type="button" class="slot-fill-close">${icon('close')}</button><small id="slot-fill-subtitle">PREENCHER ESPAÇO</small><h2 id="slot-fill-title">VALOR DO DADO</h2><p id="slot-fill-info"></p><div class="slot-fill-actions"><button type="button" class="btn-slot-roll" id="btn-slot-roll-die">${icon('d20',15)} ROLAR 1d6</button><div class="slot-quick-numbers"><button type="button" data-pick-val="1">1</button><button type="button" data-pick-val="2">2</button><button type="button" data-pick-val="3">3</button><button type="button" data-pick-val="4">4</button><button type="button" data-pick-val="5">5</button><button type="button" data-pick-val="6">6</button></div><div class="slot-manual-entry"><label>OUTRO VALOR<input type="number" id="slot-manual-val" min="1" max="99" placeholder="Ex: 4"></label><button type="button" id="btn-slot-confirm-manual">CONFIRMAR</button></div></div></section></div>
  <div class="modal card-editor" id="card-editor"><div class="backdrop editor-backdrop"></div><form id="card-form"><header><div><small>EDITOR DE CARD</small><h2 id="editor-title">NOVA HABILIDADE</h2></div><button type="button" class="editor-close">${icon('close')}</button></header><div class="editor-grid"><label class="span-2">TÍTULO<input name="title" maxlength="64" required></label><label>COLEÇÃO${customSelect({value:'abilities',options:[{value:'abilities',label:'Habilidades'},{value:'items',label:'Itens'}],id:'editor-schema',formName:'schema',className:'editor-select'})}</label><label>TIPO<input name="type" placeholder="Habilidade"></label><label>CUSTO<input name="cost" placeholder="Ex: 2 PD ou 1d4 PV"></label><label>ÍCONE<input name="icon" maxlength="3" placeholder="◆"></label><label>COR<input name="accent" type="color" value="#e91d25"></label><label>USAR COR${customSelect({value:'profile',options:[{value:'profile',label:'Do perfil'},{value:'custom',label:'Personalizada'}],id:'editor-color-mode',formName:'colorMode',className:'editor-select'})}</label><label>APRESENTAÇÃO${customSelect({value:'standard',options:[{value:'standard',label:'Padrão'},{value:'compact',label:'Compacto'},{value:'featured',label:'Destaque'}],id:'editor-layout',formName:'layout',className:'editor-select'})}</label><label>INICIAR${customSelect({value:'false',options:[{value:'false',label:'Expandido'},{value:'true',label:'Recolhido'}],id:'editor-collapsed',formName:'collapsed',className:'editor-select'})}</label><label class="span-2">URL DA IMAGEM<input name="imageUrl" type="url" placeholder="https://..."></label><label class="span-2 content-editor-label">CONTEÚDO<div class="rich-toolbar"><button type="button" data-format="bold"><b>B</b></button><button type="button" data-format="italic"><i>I</i></button><button type="button" data-format="underline"><u>U</u></button><span class="color-picker" title="Cor do texto"><input id="content-color" type="color" value="#67a2ff"><span>A</span></span><button type="button" data-format="color">APLICAR COR</button></div><textarea name="content" rows="5" placeholder="Descrição e regras do card..."></textarea></label>
  <section class="span-2 builder-section"><header><div><b>MARCADORES</b><small>Contador, barra, cargas ou liga/desliga. Fórmulas aceitam @{level}, @{pv} e atributos.</small></div><button type="button" data-add-marker>+ ADICIONAR</button></header><div id="marker-builder"></div></section>
   <section class="span-2 builder-section"><header><div><b>AÇÕES</b><small>Expressões como 2d6 + 1d8 + @{level}.</small></div><button type="button" data-add-action>+ ADICIONAR</button></header><div id="action-builder"></div></section></div><footer><button type="button" class="delete-card">EXCLUIR</button><span></span><button type="button" class="editor-close secondary">CANCELAR</button><button type="submit">SALVAR CARD</button></footer></form></div>
  <div class="modal system-select-modal" id="system-select-modal" style="display:none;"><div class="backdrop" data-close-system-modal></div><section><button type="button" class="skill-info-close" data-close-system-modal>${icon('close')}</button><small style="color:var(--red);font-weight:800;letter-spacing:.15em;">NOVA FICHA</small><h2>ESCOLHA O TIPO DE FICHA</h2><p>Selecione a base mecânica para esta nova ficha. Todas as fichas coexistem na sua base de dados organizada por pastas.</p><div class="system-options-grid"><div class="system-option-card card-v2" data-create-system="ordem2"><span class="badge-system-sigil">SISTEMA II</span><h3>ORDEM PARANORMAL II</h3><p>Playtest Alpha de "A Maldição do Ídolo de Pedra". Atributos em dados (Físico, Mente, Emoção), Pontos de Determinação, Perfis táticos e cards interativos.</p></div><div class="system-option-card card-original" data-create-system="original"><span class="badge-system-sigil">SISTEMA ORIGINAL</span><h3>ORDEM PARANORMAL RPG</h3><p>Sistema clássico de regras d20. 5 Atributos (AGI, FOR, INT, PRE, VIG), Classes, Trilhas, NEX% (0-99%), Sanidade, Esforço, 28 Perícias d20, Rituais e Inventário.</p></div><div class="system-option-card card-threat" data-create-system="threat"><span class="badge-system-sigil">AMEAÇA DA REALIDADE</span><h3>AMEAÇA / CRIATURA</h3><p>Ficha de criatura paranormal ou inimigo com VD (Valor de Desafio), Elementos do Outro Lado, Ações padrão/livre, Ataques e Habilidades de combate.</p></div></div></section></div>
  ${renderBottomNav()}
  ${renderMobileSheetDrawer(sheets,folders,state.id,{open:sheetDrawerOpen,searchQuery:mobileSearchQuery,rollLogCount:rollLog.length,safeUrl})}
  ${renderRollLogDrawer()}
  ${isCinematic?renderMobileOrientationPrompt():''}
  ${renderBestiaryUnlockModalHtml()}
  ${renderBestiaryManageModalHtml(getBestiaryLicense())}
	 `;bind();syncMobilePresentationViewport();syncCriticalAtmosphere();const bgVideoEl=app.querySelector('.bg-video');if(bgVideoEl&&state.backgroundImage){if(!bgVideoEl.src)bgVideoEl.src=state.backgroundImage;bgVideoEl.play().catch(()=>{})}const sheetMain=app.querySelector('.sheet-main'),rightPanel=app.querySelector('.right-panel'),traditionalPage=app.querySelector('.traditional-dossier-page'),threatPage=app.querySelector('.threat-book-page'),cinematicRight=app.querySelector('.cinematic-scroll'),cinematicSkills=app.querySelector('.cinematic-skills>div'),sheetSwitcher=app.querySelector('.sheet-switcher'),vigiliaSkills=app.querySelector('.vigilia-skills-table');if(sheetMain)sheetMain.scrollTop=previousScroll.sheet;if(rightPanel)rightPanel.scrollTop=previousScroll.right;if(traditionalPage)traditionalPage.scrollTop=previousScroll.traditionalPage;if(threatPage)threatPage.scrollTop=previousScroll.threatPage;if(cinematicRight)cinematicRight.scrollTop=previousScroll.cinematicRight;if(cinematicSkills)cinematicSkills.scrollTop=previousScroll.cinematicSkills;if(sheetSwitcher)sheetSwitcher.scrollTop=previousScroll.sheetSwitcher;if(vigiliaSkills)vigiliaSkills.scrollTop=previousScroll.vigiliaSkills;modeJustChanged=false;editTransitionMode=null}


function collectActiveInputs(){
 document.querySelectorAll('[data-field]').forEach(el=>{
  if(el.closest('.cinematic-ghost-exit')) return;
  const key=el.dataset.field;
  if(key&&el.value!==undefined){
   state[key]=key==='level'?Math.max(0,Number(el.value)||0):el.value;
  }
 });
 document.querySelectorAll('[data-skill-extra]').forEach(el=>{
  if(el.closest('.cinematic-ghost-exit')) return;
  const rawId=el.dataset.skillExtra;
  const numIdx=Number(rawId);
  if(!isNaN(numIdx)&&state.skills&&state.skills[numIdx]){
   state.skills[numIdx].extra=Number(el.value)||0;
  }else if(state.pericias&&state.pericias[rawId]){
   state.pericias[rawId].extra=Number(el.value)||0;
  }
 });
 document.querySelectorAll('[data-original-field]').forEach(el=>{
  if(el.closest('.cinematic-ghost-exit')) return;
  const key=el.dataset.originalField;
  if(key&&el.value!==undefined){
   if(['defesaOutros','pvTemp','peTemp','sanTemp'].includes(key)){
    state[key]=Number(el.value)||0;
   }else if(['name','deslocamento','history'].includes(key)){
    state[key]=el.value;
   }
  }
 });
 document.querySelectorAll('[data-attack-field]').forEach(el=>{
  if(el.closest('.cinematic-ghost-exit')) return;
  const [idxStr, field] = el.dataset.attackField.split(':');
  const idx = Number(idxStr);
  if (!isNaN(idx) && state.ataques && state.ataques[idx] && field) {
   state.ataques[idx][field] = el.value;
  }
 });
 document.querySelectorAll('[data-inv-field]').forEach(el=>{
  if(el.closest('.cinematic-ghost-exit')) return;
  const [idxStr, field] = el.dataset.invField.split(':');
  const idx = Number(idxStr);
  if (!isNaN(idx) && state.inventario && state.inventario[idx] && field) {
   if (field === 'espaco' || field === 'qtd') {
    state.inventario[idx][field] = Number(el.value) || 0;
   } else {
    state.inventario[idx][field] = el.value;
   }
  }
 });
 if(state.systemMode==='original'){
  state.maxPv=originalCalcPvMax(state);
  state.maxPe=originalCalcPeMax(state);
  state.maxSan=originalCalcSanMax(state);
 }
}

/* Rascunho de edição: o que muda durante o jogo (PV, PE, SAN, PD, marcadores)
   é gravado automaticamente; o resto do que é alterado no modo edição fica só
   em memória até o jogador clicar em SALVAR (ou é desfeito em DESCARTAR / ao
   recarregar a página). */
// (viewMode e cinematicCollapsed são só estado de interface, então também não contam como edição)
const LIVE_FIELDS=['pv','pvTemp','pvMarcas','pd','pdTemp','pe','peTemp','san','sanTemp','sanMarcas','condicoesAtivas','viewMode','cinematicCollapsed'];
const LIVE_MARKER_FIELDS=['current','slots'];
const draftBaseline=new Map(); // id -> cópia da ficha como estava ao entrar no modo edição
const dirtySheets=new Set();   // ids com alterações de edição ainda não salvas
function deepEqual(a,b){
 if(a===b)return true;
 // inputs devolvem texto: 12 e '12' contam como o mesmo valor
 if(typeof a!=='object'||typeof b!=='object'||a===null||b===null)return a!=null&&b!=null&&typeof a!==typeof b&&String(a)===String(b);
 if(Array.isArray(a)!==Array.isArray(b))return false;
 const keysA=Object.keys(a).filter(k=>a[k]!==undefined),keysB=Object.keys(b).filter(k=>b[k]!==undefined);
 if(keysA.length!==keysB.length)return false;
 return keysA.every(k=>deepEqual(a[k],b[k]));
}
// Versão da ficha que vai para o armazenamento: a própria ficha, ou — se ela
// tem rascunho — a última versão salva com os valores "de jogo" atuais por cima.
function persistedSheet(sheet){
 const base=draftBaseline.get(sheet.id);
 if(!base||!dirtySheets.has(sheet.id))return sheet;
 return overlayLive(base,sheet);
}
function overlayLive(base,sheet){
 const out={...base};
 LIVE_FIELDS.forEach(key=>{if(key in sheet)out[key]=sheet[key]});
 if(Array.isArray(base.cards)&&Array.isArray(sheet.cards)){
  out.cards=base.cards.map(baseCard=>{
   const card=sheet.cards.find(c=>c.id===baseCard.id);
   if(!card||!Array.isArray(baseCard.markers)||!Array.isArray(card.markers))return baseCard;
   return {...baseCard,markers:baseCard.markers.map(baseMarker=>{
    const marker=card.markers.find(m=>m.id===baseMarker.id);
    if(!marker)return baseMarker;
    const merged={...baseMarker};
    LIVE_MARKER_FIELDS.forEach(key=>{if(key in marker)merged[key]=marker[key]});
    return merged;
   })};
  });
 }
 return out;
}
// Chamado a cada render: guarda a base ao entrar no modo edição e a solta ao
// sair dele sem alterações pendentes.
function syncDraftBaseline(){
 if(!state)return;
 [...draftBaseline.keys()].forEach(id=>{if(!dirtySheets.has(id)&&!(editMode&&id===state.id))draftBaseline.delete(id)});
 if(editMode&&!draftBaseline.has(state.id))draftBaseline.set(state.id,clone(state));
}
function refreshDirty(){
 const base=draftBaseline.get(state.id);
 if(!base)return;
 if(deepEqual(overlayLive(base,state),state))dirtySheets.delete(state.id); else dirtySheets.add(state.id);
}
function discardDraft(){
 const base=draftBaseline.get(state.id);
 if(!base||!dirtySheets.has(state.id))return;
 const restored=normalizeSheet(clone(overlayLive(base,state)));
 dirtySheets.delete(state.id);
 draftBaseline.delete(state.id);
 const index=sheets.findIndex(sheet=>sheet.id===state.id);
 state=restored;
 if(index>=0)sheets[index]=state;
 persistSheetsNow();
 render();
 const toast=document.querySelector('#save-toast');
 if(toast){toast.textContent='ALTERAÇÕES DESCARTADAS';toast.classList.add('show');setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},1300)}
}
let unsavedBar=null;
function syncUnsavedBar(){
 const show=!!state&&dirtySheets.has(state.id)&&!presentationMode;
 if(!unsavedBar){
  if(!show)return;
  unsavedBar=document.createElement('div');
  unsavedBar.className='unsaved-bar';
  unsavedBar.innerHTML='<span>ALTERAÇÕES NÃO SALVAS</span><button type="button" data-discard-draft>DESCARTAR</button><button type="button" class="primary" data-commit-draft>SALVAR</button>';
  unsavedBar.querySelector('[data-discard-draft]').onclick=discardDraft;
  unsavedBar.querySelector('[data-commit-draft]').onclick=()=>save(true,'SALVO',true);
  document.body.appendChild(unsavedBar);
 }
 unsavedBar.classList.toggle('show',show);
}
window.addEventListener('beforeunload',event=>{if(dirtySheets.size){event.preventDefault();event.returnValue=''}});

/* Persistência (JSON de vários MB) é adiada e agrupada: cliques rápidos em PV/PD e transições de ficha não travam a thread principal. */
let persistTimer=0;
function persistSheetsNow(forceSync=false){
 if(_glitchActive&&!forceSync){
  schedulePersist(280);
  return;
 }
 clearTimeout(persistTimer);persistTimer=0;
 const out=sheets.map(persistedSheet);
 let fullJson='';
 try{
  fullJson=JSON.stringify(out);
  fetch('/api/sheets',{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body:fullJson
  }).catch(()=>{});
 }catch{}

 try{
  persistFoldersToStorage(folders, { idbSet });
 }catch{}

 try{
  idbSet('sheets',out);
  idbSet('activeSheetId',state.id);
 }catch{}

 try{
  localStorage.setItem('ordem-ii-active-sheet',state.id);
  if(fullJson&&fullJson.length<4500000){
   localStorage.setItem(SHEETS_KEY,fullJson);
  }else{
   const light=out.map(s=>({
    ...s,
    tokenImage:(s.tokenImage&&s.tokenImage.length>20000)?'':s.tokenImage,
    backgroundImage:(s.backgroundImage&&s.backgroundImage.length>20000)?'':s.backgroundImage
   }));
   const lightJson=JSON.stringify(light);
   if(lightJson.length<4500000)localStorage.setItem(SHEETS_KEY,lightJson);
  }
 }catch{}
}
function schedulePersist(delay=350){clearTimeout(persistTimer);persistTimer=setTimeout(()=>persistSheetsNow(false),delay)}
window.addEventListener('pagehide',()=>{if(persistTimer)persistSheetsNow(true)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&persistTimer)persistSheetsNow(true)});
// commit=true (botão SALVAR) grava também o rascunho de edição da ficha atual.
function save(showToast=true,toastMsg='SALVO',commit=false){
 collectActiveInputs();
 const index=sheets.findIndex(sheet=>sheet.id===state.id);
 if(index>=0)sheets[index]=state; else sheets.push(state);
 if(commit){
  dirtySheets.delete(state.id);
  if(editMode)draftBaseline.set(state.id,clone(state)); else draftBaseline.delete(state.id);
 }else refreshDirty();
 if(showToast)persistSheetsNow(); else schedulePersist();
 syncUnsavedBar();

 if(showToast){
  const toast=document.querySelector('#save-toast');
  if(toast){
   toast.textContent=toastMsg;
   toast.classList.add('show');
   setTimeout(()=>toast.classList.remove('show'),1100);
  }
 }
}

function setNestedProperty(obj, path, value) {
 if (!obj || !path) return;
 const parts = path.split('.');
 let curr = obj;
 for (let i = 0; i < parts.length - 1; i++) {
  if (!curr[parts[i]]) curr[parts[i]] = {};
  curr = curr[parts[i]];
 }
 curr[parts[parts.length - 1]] = value;
}

function bindThreatBookEvents() {
 if (state.systemMode !== 'threat') return;

 document.querySelectorAll('[data-threat-roll-attr]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const attrKey = el.dataset.threatRollAttr;
   const attrVal = Number(state.atributos?.[attrKey] ?? 2);
   const count = attrVal > 0 ? attrVal : 2;
   const rollMode = attrVal > 0 ? 'highest' : 'lowest';
   const attrNames = { agi: 'Agilidade', for: 'Força', int: 'Intelecto', pre: 'Presença', vig: 'Vigor' };
   roll(`Atributo: ${attrNames[attrKey] || attrKey.toUpperCase()} [${safe(state.name)}]`, Array(count).fill(20), 0, rollMode);
  };
 });

 document.querySelectorAll('[data-threat-roll-save]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const key = el.dataset.threatRollSave;
   applyDerivedDice(state);
   const saveObj = state.salvaguardas?.[key] || { dados: 2, bonus: 0 };
   const dados = Math.max(1, Number(saveObj.dados) || 1);
   const bonus = Number(saveObj.bonus) || 0;
   const saveNames = { fortitude: 'Fortitude', reflexos: 'Reflexos', vontade: 'Vontade' };
   roll(`Resistência: ${saveNames[key] || key.toUpperCase()} [${safe(state.name)}]`, Array(dados).fill(20), bonus, 'highest');
  };
 });

 document.querySelectorAll('[data-threat-roll-sense]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const key = el.dataset.threatRollSense;
   applyDerivedDice(state);
   const senseObj = state.sentidos?.[key] || { dados: 2, bonus: 0 };
   const dados = Math.max(1, Number(senseObj.dados) || 1);
   const bonus = Number(senseObj.bonus) || 0;
   const senseNames = { percepcao: 'Percepção', iniciativa: 'Iniciativa' };
   roll(`Sentidos: ${senseNames[key] || key.toUpperCase()} [${safe(state.name)}]`, Array(dados).fill(20), bonus, 'highest');
  };
 });

 document.querySelectorAll('[data-threat-roll-presence]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const dano = state.presenca?.dano || '3d6';
   const tipo = state.presenca?.tipoDano || 'mental';
   rollExpression(`Presença Perturbadora: ${dano} ${tipo} [${safe(state.name)}]`, dano);
  };
 });

 document.querySelectorAll('[data-threat-roll-atk-test]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const [actionId, atkId] = el.dataset.threatRollAtkTest.split(':');
   const action = (state.acoes || []).find(a => a.id === actionId);
   const attack = (action?.ataques || []).find(atk => atk.id === atkId);
   if (!attack) return;
   const dados = Math.max(1, Number(attack.teste?.dados) || 1);
   const bonus = Number(attack.teste?.bonus) || 0;
   roll(`Ataque: ${attack.nome || action.nome} [${safe(state.name)}]`, Array(dados).fill(20), bonus, 'highest');
  };
 });

 document.querySelectorAll('[data-threat-roll-atk-dmg]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const [actionId, atkId] = el.dataset.threatRollAtkDmg.split(':');
   const action = (state.acoes || []).find(a => a.id === actionId);
   const attack = (action?.ataques || []).find(atk => atk.id === atkId);
   if (!attack || !attack.dano) return;
   rollExpression(`Dano: ${attack.nome || action.nome} (${attack.tipoDano || ''}) [${safe(state.name)}]`, attack.dano);
  };
 });

 document.querySelectorAll('[data-threat-roll-pericia]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const pId = el.dataset.threatRollPericia;
   const p = (state.pericias || []).find(item => item.id === pId);
   if (!p) return;
   const dados = Math.max(1, Number(p.dados) || 1);
   const bonus = Number(p.bonus) || 0;
   roll(`Perícia: ${p.nome} [${safe(state.name)}]`, Array(dados).fill(20), bonus, 'highest');
  };
 });

 document.querySelectorAll('[data-threat-pv-delta]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const delta = Number(el.dataset.threatPvDelta) || 0;
   const prev = state.pv;
   const currentPv = (state.pv !== undefined && state.pv !== null && !isNaN(Number(state.pv))) ? Number(state.pv) : (state.pvMax || 100);
   state.pv = Math.max(0, Math.min(state.pvMax, currentPv + delta));
   if (prev !== state.pv) playResourceSound(delta > 0);
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-attr-step]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const [attrKey, deltaStr] = btn.dataset.threatAttrStep.split(':');
   const delta = Number(deltaStr) || 0;
   if (!state.atributos) state.atributos = {};
   const current = Number(state.atributos[attrKey]) || 0;
   state.atributos[attrKey] = Math.max(0, Math.min(15, current + delta));
   applyDerivedDice(state);
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-add-temp]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const val = prompt('Quantidade de PV Temporário:', '10');
   if (val !== null) {
    state.pvTemp = Math.max(0, Number(val) || 0);
    save(false);
    render();
   }
  };
 });

 document.querySelectorAll('[data-threat-clear-temp]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   state.pvTemp = 0;
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-select-primary-elem]').forEach(select => {
  select.onchange = (e) => {
   e.stopPropagation();
   const newElem = select.value;
   state.elementoDestaque = newElem;
   if (!state.sigilImage) {
    state.sigiloId = newElem;
   }
   if (!Array.isArray(state.elementos)) state.elementos = [];
   if (!state.elementos.includes(newElem)) {
    state.elementos.unshift(newElem);
   }
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-del-comp]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const elemId = btn.dataset.threatDelComp;
   state.elementos = (state.elementos || []).filter(el => el !== elemId);
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-add-comp]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const elemId = btn.dataset.threatAddComp;
   if (!Array.isArray(state.elementos)) state.elementos = [state.elementoDestaque || 'sangue'];
   if (!state.elementos.includes(elemId)) {
    state.elementos.push(elemId);
   }
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-open-export]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const toast = document.querySelector('#save-toast');
   const showToastMsg = (msg, duration = 2200) => {
    if (toast) { toast.textContent = msg; toast.classList.add('show'); setTimeout(() => { toast.classList.remove('show'); toast.textContent = 'SALVO'; }, duration); }
   };
   openThreatExportModal(state, { showToastMsg });
  };
 });

 document.querySelectorAll('[data-threat-open-bg]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const modal = document.querySelector('#threat-bg-modal');
   if (modal) modal.style.display = 'flex';
  };
 });

 const threatBgInput = document.querySelector('#threat-bg-file-input');
 if (threatBgInput) {
  threatBgInput.onchange = () => {
   if (threatBgInput.files && threatBgInput.files[0]) {
    readMedia(threatBgInput.files[0], 'backgroundImage');
   }
  };
 }

 document.querySelectorAll('[data-threat-reset-bg]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.backgroundImage = '';
   state.backgroundBlur = 0;
   state.backgroundZoom = 100;
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-preset-bg]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.backgroundImage = btn.dataset.threatPresetBg || '';
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-bg-blur]').forEach(input => {
  input.oninput = () => {
   const val = Math.max(0, Math.min(50, Number(input.value) || 0));
   state.backgroundBlur = val;
   document.querySelectorAll('.threat-book-page').forEach(page => page.style.setProperty('--bg-blur', `${val}px`));
   const hint = document.querySelector('#threat-blur-val');
   if (hint) hint.textContent = `${val}px`;
  };
  input.onchange = () => save(false);
 });

 document.querySelectorAll('[data-threat-bg-zoom]').forEach(input => {
  input.oninput = () => {
   const val = Math.max(20, Math.min(300, Number(input.value) || 100));
   state.backgroundZoom = val;
   document.querySelectorAll('.threat-book-page').forEach(page => page.style.setProperty('--bg-zoom', `${val / 100}`));
   const hint = document.querySelector('#threat-zoom-val');
   if (hint) hint.textContent = `${val}%`;
  };
  input.onchange = () => save(false);
 });

 document.querySelectorAll('[data-threat-reset-bg-effects]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.backgroundBlur = 0;
   state.backgroundZoom = 100;
   save(false);
   render();
  };
 });

 const threatTokenInput = document.querySelector('#threat-token-file-input');
 if (threatTokenInput) {
  threatTokenInput.onchange = () => {
   if (threatTokenInput.files && threatTokenInput.files[0]) {
    readImage(threatTokenInput.files[0], 'tokenImage', 2048);
   }
  };
 }

 document.querySelectorAll('[data-threat-remove-token]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.tokenImage = '';
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-theme-color]').forEach(input => {
  input.oninput = () => {
   const col = input.value;
   state.themeColor = col;
   let clean = (col || '').replace('#', '').trim();
   if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
   const r = parseInt(clean.slice(0, 2), 16) || 0;
   const g = parseInt(clean.slice(2, 4), 16) || 0;
   const b = parseInt(clean.slice(4, 6), 16) || 0;
   const lum = 0.299 * r + 0.587 * g + 0.114 * b;
   const ink = lum > 155 ? '#0c0e14' : '#ffffff';
   document.querySelectorAll('.threat-book-page').forEach(page => {
    page.style.setProperty('--threat-elem-color', col);
    page.style.setProperty('--threat-elem-ink', ink);
    page.style.setProperty('--threat-elem-glow', `rgba(${r}, ${g}, ${b}, 0.35)`);
    if (!state.bannerColor) {
     page.style.setProperty('--threat-banner-bg', col);
     page.querySelectorAll('.threat-banner-left').forEach(el => el.style.setProperty('background', col, 'important'));
    }
   });
  };
  input.onchange = () => {
   state.themeColor = input.value;
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-reset-theme-color]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.themeColor = '';
   save(false);
   render();
  };
 });

 // ── COR DO CARD / BANNER DO ELEMENTO ──
 document.querySelectorAll('[data-threat-banner-color]').forEach(input => {
  input.oninput = () => {
   const col = input.value;
   state.bannerColor = col;
   document.querySelectorAll('.threat-book-page').forEach(page => {
    page.style.setProperty('--threat-banner-bg', col);
    page.querySelectorAll('.threat-banner-left').forEach(el => el.style.setProperty('background', col, 'important'));
   });
  };
  input.onchange = () => {
   state.bannerColor = input.value;
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-reset-banner-color]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.bannerColor = '';
   save(false);
   render();
  };
 });

 // ── COR DO TEXTO DA FICHA ──
 document.querySelectorAll('[data-threat-text-color]').forEach(input => {
  input.oninput = () => {
   const col = input.value;
   state.textColor = col;
   document.querySelectorAll('.threat-book-page').forEach(page => {
    page.style.setProperty('--threat-text-color', col);
   });
  };
  input.onchange = () => {
   state.textColor = input.value;
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-reset-text-color]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.textColor = '';
   save(false);
   render();
  };
 });

 // ── MODO DE CONTRASTE (AUTO / ESCURO / CLARO) ──
 document.querySelectorAll('[data-threat-toggle-contrast]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   if (!state.contrast || state.contrast === 'auto') {
    state.contrast = 'dark';
   } else if (state.contrast === 'dark') {
    state.contrast = 'light';
   } else {
    state.contrast = 'auto';
   }
   save(false);
   render();
  };
 });

 // ── SUBTÍTULO DO CABEÇALHO ──
 document.querySelectorAll('[data-threat-clear-subtitle]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.subtitulo = '';
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-set-elem-subtitle]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const elemKey = state.elementoDestaque || 'sangue';
   const elemObj = THREAT_ELEMENTS[elemKey] || THREAT_ELEMENTS.sangue;
   state.subtitulo = elemObj ? elemObj.nome.toUpperCase() : 'SANGUE';
   save(false);
   render();
  };
 });

 // ── INTRODUÇÃO E ARTE NARRATIVA DO LIVRO ──
 document.querySelectorAll('[data-threat-toggle-intro]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.hasIntro = !state.hasIntro;
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-intro-align]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.introSide = btn.dataset.threatIntroAlign;
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-intro-file-input]').forEach(input => {
  input.onchange = () => {
   if (input.files && input.files[0]) {
    readImage(input.files[0], 'introImage', 2048);
   }
  };
 });

 document.querySelectorAll('[data-threat-remove-intro-image]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.introImage = '';
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-open-sigil-modal]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const modal = document.querySelector('#threat-sigil-modal');
   if (modal) modal.style.display = 'flex';
  };
 });

 document.querySelectorAll('[data-threat-pick-sigil]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.sigiloId = btn.dataset.threatPickSigil || '';
   state.sigilImage = '';
   save(false);
   render();
  };
 });

 const threatSigilFileInput = document.querySelector('#threat-sigil-file-input');
 if (threatSigilFileInput) {
  threatSigilFileInput.onchange = () => {
   if (threatSigilFileInput.files && threatSigilFileInput.files[0]) {
    readImage(threatSigilFileInput.files[0], 'sigilImage', 512);
   }
  };
 }

 document.querySelectorAll('[data-threat-pick-custom-sigil]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   if (threatSigilFileInput) threatSigilFileInput.click();
  };
 });

 document.querySelectorAll('[data-threat-clear-custom-sigil]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.sigilImage = '';
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-reset-sigil]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   state.sigiloId = '';
   state.sigilImage = '';
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-toggle-categoria]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   state.categoria = state.categoria === 'mundana' ? 'paranormal' : 'mundana';
   if (state.categoria === 'mundana') {
    state.tipo = 'Humano';
   } else {
    state.tipo = 'Criatura';
    if (!state.elementos || !state.elementos.length) state.elementos = ['sangue'];
    state.elementoDestaque = state.elementos[0];
   }
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-field]').forEach(input => {
  input.onchange = (e) => {
   const path = input.dataset.threatField;
   let val = input.value;
   if (input.type === 'number' || path === 'vd' || path === 'defesa') val = Number(val) || 0;
   setNestedProperty(state, path, val);
   if (path === 'pvMax' && state.pv > val) state.pv = val;
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-attr-input]').forEach(input => {
  input.onchange = (e) => {
   const attrKey = input.dataset.threatAttrInput;
   if (!state.atributos) state.atributos = {};
   state.atributos[attrKey] = Math.max(0, Number(input.value) || 0);
   applyDerivedDice(state);
   save(false);
   render();
  };
 });

 function closeThreatActionModal() {
  const modal = document.querySelector('#threat-action-modal');
  if (!modal) return;
  modal.classList.add('closing');
  setTimeout(() => modal.classList.remove('open', 'closing'), 160);
 }

 document.querySelectorAll('[data-close-threat-modal]').forEach(btn => {
  btn.onclick = () => {
   closeThreatActionModal();
   document.querySelectorAll('.threat-modal').forEach(m => m.style.display = 'none');
  };
 });

 function openThreatActionModal(action = null) {
  const modal = document.querySelector('#threat-action-modal');
  if (!modal) return;
  const form = modal.querySelector('#threat-action-form');
  const attacksContainer = modal.querySelector('#threat-attacks-container');
  const modalTitle = modal.querySelector('#threat-action-modal-title');
  const delBtn = modal.querySelector('#threat-action-delete-btn');
  
  if (modalTitle) modalTitle.textContent = action ? 'EDITAR AÇÃO' : 'NOVA AÇÃO';
  form.querySelector('#threat-action-id').value = action ? action.id : '';
  form.querySelector('#threat-action-type').value = action ? action.tipoAcao : 'padrao';
  form.querySelector('#threat-action-name-input').value = action ? action.nome : '';
  form.querySelector('#threat-action-trigger').value = action ? (action.gatilho || '') : '';
  form.querySelector('#threat-action-hurt').value = action ? (action.ativaQuando || '') : '';
  const colInput = form.querySelector('#threat-action-column');
  if (colInput) colInput.value = action ? (action.coluna || 'direita') : 'direita';
  form.querySelector('#threat-action-text-input').value = action ? (action.texto || '') : '';

  if (delBtn) {
   delBtn.style.display = action ? 'block' : 'none';
   delBtn.onclick = () => {
    if (action && confirm(`Excluir a ação "${action.nome}"?`)) {
     state.acoes = (state.acoes || []).filter(a => a.id !== action.id);
     closeThreatActionModal();
     save(false);
     render();
    }
   };
  }

  attacksContainer.innerHTML = '';
  const attacks = action ? (action.ataques || []) : [];
  if (attacks.length > 0) {
   attacks.forEach((atk, idx) => addAttackRow(attacksContainer, atk, idx));
  } else if (!action) {
   addAttackRow(attacksContainer, null, 0);
  } else {
   attacksContainer.innerHTML = '<p class="builder-empty">Nenhum ataque cadastrado para esta ação.</p>';
  }

  modal.classList.remove('closing');
  modal.classList.add('open');
  form.querySelector('#threat-action-name-input').focus();
 }

 function addAttackRow(container, atk = null, idx = 0) {
  const emptyMsg = container.querySelector('.builder-empty');
  if (emptyMsg) emptyMsg.remove();

  const row = document.createElement('article');
  row.className = 'builder-row threat-attack-builder-row';
  const currentCount = container.querySelectorAll('.threat-attack-builder-row').length + 1;
  row.innerHTML = `
   <div class="builder-row-head">
    <b style="color:var(--threat-elem-color, #e0150d);letter-spacing:0.12em;font-size:9px;">ATAQUE #${currentCount}</b>
    <button type="button" data-remove-attack-row title="Excluir ataque">${icon('trash', 15)}</button>
   </div>
   <div class="threat-atk-fields-grid">
    <label class="atk-field-name">
     NOME DO ATAQUE
     <input type="text" data-atk-name value="${safe(atk?.nome || 'Ataque')}" placeholder="Ex: Mordida, Garras, Pancada...">
    </label>
    <label class="atk-field-range">
     ALCANCE
     <select data-atk-range>
      <option value="corpo" ${atk?.alcance === 'corpo' ? 'selected' : ''}>Corpo a corpo</option>
      <option value="curto" ${atk?.alcance === 'curto' ? 'selected' : ''}>Curto</option>
      <option value="medio" ${atk?.alcance === 'medio' ? 'selected' : ''}>Médio</option>
      <option value="longo" ${atk?.alcance === 'longo' ? 'selected' : ''}>Longo</option>
      <option value="extremo" ${atk?.alcance === 'extremo' ? 'selected' : ''}>Extremo</option>
     </select>
    </label>
    <label class="atk-field-mult">
     QUANTIDADE (X)
     <input type="number" min="1" max="10" data-atk-mult value="${atk?.multiplicador ?? 1}" placeholder="1">
    </label>
    <label class="atk-field-dice">
     DADOS (D20)
     <input type="number" min="1" max="10" data-atk-dados value="${atk?.teste?.dados ?? 3}">
    </label>
    <label class="atk-field-bonus">
     BÔNUS TESTE
     <input type="number" data-atk-bonus value="${atk?.teste?.bonus ?? 10}">
    </label>
    <label class="atk-field-crit">
     MARGEM / CRÍTICO
     <input type="text" data-atk-critico value="${safe(atk?.critico || '20/x2')}" placeholder="20/x2">
    </label>
    <label class="atk-field-damage">
     FÓRMULA DE DANO
     <input type="text" data-atk-dano value="${safe(atk?.dano || '2d8+6')}" placeholder="2d8+6">
    </label>
    <label class="atk-field-type">
     TIPO DE DANO
     <input type="text" data-atk-tipo value="${safe(atk?.tipoDano || 'Impacto')}" placeholder="Impacto, Sangue...">
    </label>
   </div>
  `;

  row.querySelector('[data-remove-attack-row]').onclick = () => {
   row.remove();
   const rows = container.querySelectorAll('.threat-attack-builder-row');
   if (rows.length === 0) {
    container.innerHTML = '<p class="builder-empty">Nenhum ataque cadastrado para esta ação.</p>';
   } else {
    rows.forEach((r, i) => {
     const b = r.querySelector('.builder-row-head b');
     if (b) b.textContent = `ATAQUE #${i + 1}`;
    });
   }
  };
  container.appendChild(row);
 }

 function applyThreatTextFormat(type) {
  const textarea = document.querySelector('#threat-action-text-input');
  if (!textarea) return;
  const start = textarea.selectionStart, end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || 'texto';
  let before = '', after = '';
  if (type === 'bold') { before = '**'; after = '**'; }
  if (type === 'italic') { before = '*'; after = '*'; }
  if (type === 'underline') { before = '[u]'; after = '[/u]'; }
  if (type === 'color') {
   const colInput = document.querySelector('#threat-action-color');
   const color = colInput ? colInput.value : '#cca02b';
   before = `[color=${color}]`;
   after = '[/color]';
  }
  textarea.setRangeText(`${before}${selected}${after}`, start, end, 'select');
  textarea.focus();
 }

 document.querySelectorAll('[data-threat-format]').forEach(el => {
  el.onclick = () => applyThreatTextFormat(el.dataset.threatFormat);
 });

 const threatColorInput = document.querySelector('#threat-action-color');
  if (threatColorInput) {
  threatColorInput.oninput = () => {
   const span = threatColorInput.parentElement?.querySelector('span');
   if (span) span.style.textDecorationColor = threatColorInput.value;
  };
 }

 document.querySelectorAll('[data-threat-add-action]').forEach(btn => {
  btn.onclick = () => openThreatActionModal(null);
 });

 document.querySelectorAll('[data-threat-edit-action]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const actionId = btn.dataset.threatEditAction;
   const action = (state.acoes || []).find(a => a.id === actionId);
   if (action) openThreatActionModal(action);
  };
 });

 document.querySelectorAll('[data-threat-del-action]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const actionId = btn.dataset.threatDelAction;
   if (confirm('Tem certeza que deseja excluir esta ação?')) {
    state.acoes = (state.acoes || []).filter(a => a.id !== actionId);
    save(false);
    render();
   }
  };
 });

 const btnAddAttackRow = document.querySelector('#btn-threat-add-attack-row');
 if (btnAddAttackRow) {
  btnAddAttackRow.onclick = () => {
   const container = document.querySelector('#threat-attacks-container');
   if (container) addAttackRow(container);
  };
 }

 const actionForm = document.querySelector('#threat-action-form');
 if (actionForm) {
  actionForm.onsubmit = (e) => {
   e.preventDefault();
   const actionId = actionForm.querySelector('#threat-action-id').value;
   const tipoAcao = actionForm.querySelector('#threat-action-type').value;
   const nome = actionForm.querySelector('#threat-action-name-input').value.trim() || 'Ação';
   const gatilho = actionForm.querySelector('#threat-action-trigger').value.trim();
   const ativaQuando = actionForm.querySelector('#threat-action-hurt').value || null;
   const coluna = actionForm.querySelector('#threat-action-column')?.value || 'direita';
   const texto = actionForm.querySelector('#threat-action-text-input').value.trim();

   const attacks = [];
   document.querySelectorAll('.threat-attack-builder-row').forEach((row, i) => {
    attacks.push({
     id: `atk-${Date.now()}-${i}`,
     nome: row.querySelector('[data-atk-name]').value.trim() || 'Ataque',
     alcance: row.querySelector('[data-atk-range]').value,
     multiplicador: Math.max(1, Number(row.querySelector('[data-atk-mult]')?.value) || 1),
     teste: {
      dados: Math.max(1, Number(row.querySelector('[data-atk-dados]').value) || 2),
      bonus: Number(row.querySelector('[data-atk-bonus]').value) || 0
     },
     dano: row.querySelector('[data-atk-dano]').value.trim() || '1d8',
     tipoDano: row.querySelector('[data-atk-tipo]').value.trim() || 'Impacto',
     critico: row.querySelector('[data-atk-critico]').value.trim() || '20/x2'
    });
   });

   if (!Array.isArray(state.acoes)) state.acoes = [];
   const existingIdx = state.acoes.findIndex(a => a.id === actionId);
   const actionObj = {
    id: actionId || `act-${Date.now()}`,
    tipoAcao,
    nome,
    gatilho,
    custo: '',
    usos: null,
    ataques: attacks,
    texto,
    coluna,
    ativaQuando,
    fase: null
   };

   if (existingIdx >= 0) {
    state.acoes[existingIdx] = actionObj;
   } else {
    state.acoes.push(actionObj);
   }

   closeThreatActionModal();
   save(false);
   render();
  };
 }

 // ── DEFESAS INTERATIVAS: CARDS, TAGS & RD INLINE ──
 document.querySelectorAll('[data-threat-edit-res-idx]').forEach(input => {
  input.oninput = (e) => {
   const idx = Number(e.target.dataset.threatEditResIdx);
   if (Array.isArray(state.resistencias) && state.resistencias[idx]) {
    state.resistencias[idx].valor = Math.max(0, Number(e.target.value) || 0);
    save(false);
   }
  };
 });

 document.querySelectorAll('[data-threat-del-res]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const idx = Number(btn.dataset.threatDelRes);
   if (Array.isArray(state.resistencias)) {
    state.resistencias.splice(idx, 1);
    save(false);
    render();
   }
  };
 });

 document.querySelectorAll('[data-threat-del-vuln]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const idx = Number(btn.dataset.threatDelVuln);
   if (Array.isArray(state.vulnerabilidades)) {
    state.vulnerabilidades.splice(idx, 1);
    save(false);
    render();
   }
  };
 });

 document.querySelectorAll('[data-threat-del-imun]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const idx = Number(btn.dataset.threatDelImun);
   if (Array.isArray(state.imunidades)) {
    state.imunidades.splice(idx, 1);
    save(false);
    render();
   }
  };
 });

 const DEFENSE_PRESET_TAGS = {
  res: ['Balístico', 'Impacto', 'Perfuração', 'Corte', 'Fogo', 'Frio', 'Eletricidade', 'Químico', 'Sangue', 'Morte', 'Energia', 'Conhecimento', 'Mental', 'Dano Geral'],
  vuln: ['Sangue', 'Morte', 'Energia', 'Conhecimento', 'Medo', 'Fogo', 'Frio', 'Eletricidade', 'Químico', 'Balístico', 'Impacto', 'Perfuração', 'Corte'],
  imun: ['Condições de Medo', 'Dano Mental', 'Hemorragia', 'Atordoamento', 'Paralisia', 'Veneno', 'Frio', 'Fogo', 'Efeitos de Idade']
 };

 function openThreatDefenseCardModal(category = 'res') {
  const modal = document.querySelector('#threat-defense-card-modal');
  if (!modal) return;
  const catInput = modal.querySelector('#threat-def-card-category');
  const titleEl = modal.querySelector('#threat-def-card-modal-title');
  const valGroup = modal.querySelector('#threat-def-card-val-group');
  const tagInput = modal.querySelector('#threat-def-card-tag-input');
  const tagsPicker = modal.querySelector('#threat-def-quick-tags');

  catInput.value = category;
  titleEl.textContent = category === 'res' ? 'ADICIONAR RESISTÊNCIA A DANO' : (category === 'vuln' ? 'ADICIONAR VULNERABILIDADE' : 'ADICIONAR IMUNIDADE');
  valGroup.style.display = category === 'res' ? 'block' : 'none';
  tagInput.value = '';

  const tags = DEFENSE_PRESET_TAGS[category] || [];
  tagsPicker.innerHTML = tags.map(t => `<button type="button" class="threat-def-tag-chip" data-quick-tag="${t}">${t}</button>`).join('');
  tagsPicker.querySelectorAll('[data-quick-tag]').forEach(chip => {
   chip.onclick = () => {
    tagInput.value = chip.dataset.quickTag;
    tagInput.focus();
   };
  });

  modal.style.display = 'grid';
  tagInput.focus();
 }

 document.querySelectorAll('[data-threat-add-defense-trigger]').forEach(btn => {
  btn.onclick = () => openThreatDefenseCardModal(btn.dataset.threatAddDefenseTrigger || 'res');
 });

 document.querySelectorAll('[data-def-quick-rd]').forEach(btn => {
  btn.onclick = () => {
   const input = document.querySelector('#threat-def-card-val-input');
   if (input) input.value = btn.dataset.defQuickRd;
  };
 });

 const defCardForm = document.querySelector('#threat-defense-card-form');
 if (defCardForm) {
  defCardForm.onsubmit = (e) => {
   e.preventDefault();
   const cat = defCardForm.querySelector('#threat-def-card-category').value;
   const tag = defCardForm.querySelector('#threat-def-card-tag-input').value.trim();
   const val = Number(defCardForm.querySelector('#threat-def-card-val-input').value) || 10;
   if (!tag) return;

   if (cat === 'res') {
    if (!Array.isArray(state.resistencias)) state.resistencias = [];
    state.resistencias.push({ tipo: tag, valor: val });
   } else if (cat === 'vuln') {
    if (!Array.isArray(state.vulnerabilidades)) state.vulnerabilidades = [];
    if (!state.vulnerabilidades.includes(tag)) state.vulnerabilidades.push(tag);
   } else if (cat === 'imun') {
    if (!Array.isArray(state.imunidades)) state.imunidades = [];
    if (!state.imunidades.includes(tag)) state.imunidades.push(tag);
   }

   const modal = document.querySelector('#threat-defense-card-modal');
   if (modal) modal.style.display = 'none';
   save(false);
   render();
  };
 }

 function openThreatSectionModal(section = null) {
  const modal = document.querySelector('#threat-section-modal');
  if (!modal) return;
  const form = modal.querySelector('#threat-section-form');
  modal.querySelector('#threat-section-modal-title').textContent = section ? 'EDITAR SEÇÃO' : 'NOVA SEÇÃO / ENIGMA';
  form.querySelector('#threat-section-id').value = section ? section.id : '';
  form.querySelector('#threat-section-style').value = section ? section.estilo : 'normal';
  const colInput = form.querySelector('#threat-section-column');
  if (colInput) colInput.value = section ? (section.coluna || 'esquerda') : 'esquerda';
  form.querySelector('#threat-section-title-input').value = section ? section.titulo : '';
  form.querySelector('#threat-section-body-input').value = section ? section.corpo : '';
  modal.style.display = 'grid';
  form.querySelector('#threat-section-title-input').focus();
 }

 document.querySelectorAll('[data-threat-add-section]').forEach(btn => {
  btn.onclick = () => openThreatSectionModal(null);
 });

 document.querySelectorAll('[data-threat-edit-section]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const secId = btn.dataset.threatEditSection;
   const sec = (state.secoes || []).find(s => s.id === secId);
   if (sec) openThreatSectionModal(sec);
  };
 });

 document.querySelectorAll('[data-threat-del-section]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const secId = btn.dataset.threatDelSection;
   if (confirm('Excluir esta seção?')) {
    state.secoes = (state.secoes || []).filter(s => s.id !== secId);
    save(false);
    render();
   }
  };
 });

 const sectionForm = document.querySelector('#threat-section-form');
 if (sectionForm) {
  sectionForm.onsubmit = (e) => {
   e.preventDefault();
   const sectionId = sectionForm.querySelector('#threat-section-id').value;
   const estilo = sectionForm.querySelector('#threat-section-style').value;
   const coluna = sectionForm.querySelector('#threat-section-column')?.value || 'esquerda';
   const titulo = sectionForm.querySelector('#threat-section-title-input').value.trim() || 'Seção';
   const corpo = sectionForm.querySelector('#threat-section-body-input').value.trim();

   if (!Array.isArray(state.secoes)) state.secoes = [];
   const existingIdx = state.secoes.findIndex(s => s.id === sectionId);
   const secObj = {
    id: sectionId || `sec-${Date.now()}`,
    titulo,
    corpo,
    estilo,
    coluna
   };

   if (existingIdx >= 0) {
    state.secoes[existingIdx] = secObj;
   } else {
    state.secoes.push(secObj);
   }

   const modal = document.querySelector('#threat-section-modal');
   if (modal) modal.style.display = 'none';
   save(false);
   render();
  };
 }

 // ── WIZARD DE CRIAÇÃO E RECALIBRAÇÃO ──
 document.querySelectorAll('[data-threat-open-wizard]').forEach(btn => {
  btn.onclick = () => {
   abrirThreatWizard(state, {
    onFinish: () => {
     save(false);
     render();
    }
   });
  };
 });

 // ── ASSISTENTE DE BALANCEAMENTO ──
 let balModalVd = Number(state.vd) || 60;
 let balModalPreset = 'equilibrada';
 let balModalSlider = 0;

 function updateBalanceModalUI() {
  const modal = document.querySelector('#threat-balance-modal');
  if (!modal) return;
  const bal = getBalance(balModalVd, balModalPreset, balModalSlider);
  const evalRes = evaluateSheet(state, balModalPreset);

  const elVdInput = modal.querySelector('#threat-bal-vd-input');
  if (elVdInput) elVdInput.value = balModalVd;

  modal.querySelectorAll('.threat-bal-vd-pill').forEach(pill => {
   pill.classList.toggle('active', Number(pill.dataset.balQuickVd) === balModalVd);
  });

  modal.querySelectorAll('.threat-bal-preset-btn').forEach(b => {
   b.classList.toggle('active', b.dataset.threatBalPreset === balModalPreset);
  });

  const sliderValEl = modal.querySelector('#threat-bal-slider-val');
  if (sliderValEl) {
   const sign = balModalSlider > 0 ? `+${balModalSlider}% (Mais Difícil)` : (balModalSlider < 0 ? `${balModalSlider}% (Mais Fácil)` : '0% (Padrão)');
   sliderValEl.textContent = sign;
  }

  const setEl = (id, val) => { const el = modal.querySelector(id); if (el) el.textContent = val; };
  setEl('#bal-modal-pv', bal.pv);
  setEl('#bal-modal-machucado', bal.machucado);
  setEl('#bal-modal-defesa', bal.defesa);
  setEl('#bal-modal-res-forte', `+${bal.resForte.bonus}`);
  setEl('#bal-modal-res-media', `+${bal.resMedia.bonus}`);
  setEl('#bal-modal-res-fraca', `+${bal.resFraca.bonus}`);
  setEl('#bal-modal-dt', `DT ${bal.dt}`);
  setEl('#bal-modal-dmg', bal.presenca ? `${bal.presenca.dados}d${bal.presenca.faces}` : '3d6');
  setEl('#bal-modal-nex', `NEX ${bal.imuneNex}%`);
  setEl('#bal-modal-nex-status', bal.imuneNex);
  setEl('#bal-modal-atk', `+${bal.ataque.bonus}`);
  setEl('#bal-modal-dano-medio', `~${bal.danoMedio}`);

  const pvStat = modal.querySelector('#bal-modal-pv-status');
  if (pvStat) {
   pvStat.className = `threat-bal-status status-${evalRes.pv.status}`;
   pvStat.textContent = evalRes.pv.status === 'dentro' ? 'DENTRO DA FAIXA' : (evalRes.pv.status === 'abaixo' ? 'ABAIXO DA MÉDIA' : 'ACIMA DA MÉDIA');
  }

  const defStat = modal.querySelector('#bal-modal-defesa-status');
  if (defStat) {
   defStat.className = `threat-bal-status status-${evalRes.defesa.status}`;
   defStat.textContent = evalRes.defesa.status === 'dentro' ? 'DENTRO DA FAIXA' : (evalRes.defesa.status === 'abaixo' ? 'ABAIXO DA MÉDIA' : 'ACIMA DA MÉDIA');
  }

  const formulasContainer = modal.querySelector('#bal-modal-formulas-container');
  if (formulasContainer) {
   formulasContainer.innerHTML = (bal.sugestoesDano || []).map(f => `
     <button type="button" class="threat-bal-formula-pill" data-threat-copy-formula="${f}" title="Aplicar no primeiro ataque">${f}</button>
   `).join('');
   formulasContainer.querySelectorAll('[data-threat-copy-formula]').forEach(b => {
    b.onclick = () => {
     const formStr = b.dataset.threatCopyFormula;
     if (state.acoes?.[0]?.ataques?.[0]) {
      state.acoes[0].ataques[0].dano = formStr;
      save(false);
      render();
     }
    };
   });
  }
 }

 document.querySelectorAll('[data-threat-open-balance]').forEach(btn => {
  btn.onclick = () => {
   const modal = document.querySelector('#threat-balance-modal');
   if (modal) {
    balModalVd = Number(state.vd) || 60;
    balModalPreset = 'equilibrada';
    balModalSlider = 0;
    modal.style.display = 'grid';
    updateBalanceModalUI();
   }
  };
 });

 const balVdInput = document.querySelector('#threat-bal-vd-input');
 if (balVdInput) {
  balVdInput.onchange = (e) => {
   balModalVd = Math.max(10, Math.min(400, Number(e.target.value) || 10));
   updateBalanceModalUI();
  };
 }

 document.querySelectorAll('[data-bal-quick-vd]').forEach(btn => {
  btn.onclick = () => {
   balModalVd = Number(btn.dataset.balQuickVd) || 60;
   updateBalanceModalUI();
  };
 });

 document.querySelectorAll('[data-threat-bal-preset]').forEach(btn => {
  btn.onclick = () => {
   balModalPreset = btn.dataset.threatBalPreset;
   updateBalanceModalUI();
  };
 });

 const balSlider = document.querySelector('#threat-bal-slider');
 if (balSlider) {
  balSlider.oninput = (e) => {
   balModalSlider = Number(e.target.value) || 0;
   updateBalanceModalUI();
  };
 }

 document.querySelectorAll('[data-threat-apply-bal]').forEach(btn => {
  btn.onclick = () => {
   const field = btn.dataset.threatApplyBal;
   const bal = getBalance(balModalVd, balModalPreset, balModalSlider);

   if (field === 'pv' || field === 'tudo') {
    state.pvMax = bal.pv;
    state.pv = bal.pv;
   }
   if (field === 'defesa' || field === 'tudo') {
    state.defesa = bal.defesa;
   }
   if (field === 'salvaguardas' || field === 'tudo') {
    // Os dados vêm dos atributos; o balanceamento só define o bônus
    ['fortitude', 'reflexos', 'vontade'].forEach((k, i) => {
     const src = [bal.resForte, bal.resMedia, bal.resFraca][i];
     state.salvaguardas = state.salvaguardas || {};
     state.salvaguardas[k] = { ...(state.salvaguardas[k] || {}), bonus: src.bonus };
    });
    applyDerivedDice(state);
   }
   if (field === 'presenca' || field === 'tudo') {
    if (!state.presenca) state.presenca = {};
    state.presenca.ativa = true;
    state.presenca.dt = bal.dt;
    state.presenca.dano = bal.presenca ? `${bal.presenca.dados}d${bal.presenca.faces}` : '3d6';
    state.presenca.imuneNex = bal.imuneNex;
   }
   if (field === 'tudo') {
    state.vd = balModalVd;
    const modal = document.querySelector('#threat-balance-modal');
    if (modal) modal.style.display = 'none';
   }

   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-threat-copy-formula]').forEach(b => {
  b.onclick = () => {
   const formStr = b.dataset.threatCopyFormula;
   if (state.acoes?.[0]?.ataques?.[0]) {
    state.acoes[0].ataques[0].dano = formStr;
    save(false);
    render();
   }
  };
 });

 // ── INLINE SUGGESTION CHIPS ──
 document.querySelectorAll('[data-threat-apply-sug]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const [type, ...rest] = btn.dataset.threatApplySug.split(':');
   if (type === 'pv') {
    const val = Number(rest[0]) || 100;
    state.pvMax = val;
    state.pv = val;
   } else if (type === 'defesa') {
    state.defesa = Number(rest[0]) || 20;
   } else if (type === 'presence') {
    if (!state.presenca) state.presenca = {};
    state.presenca.dt = Number(rest[0]) || 19;
    state.presenca.dano = rest[1] || '3d6';
    state.presenca.imuneNex = Number(rest[2]) || 35;
   } else if (type === 'saves') {
    state.salvaguardas = state.salvaguardas || {};
    ['fortitude', 'reflexos', 'vontade'].forEach((k, i) => {
     state.salvaguardas[k] = { ...(state.salvaguardas[k] || {}), bonus: Number(rest[i * 2 + 1]) || 0 };
    });
    applyDerivedDice(state);
   }
   save(false);
   render();
  };
 });

 // ── FRAQUEZA ELEMENTAL ──
 document.querySelectorAll('[data-threat-add-vuln]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const vuln = btn.dataset.threatAddVuln;
   if (!Array.isArray(state.vulnerabilidades)) state.vulnerabilidades = [];
   if (!state.vulnerabilidades.includes(vuln)) {
    state.vulnerabilidades.push(vuln);
    save(false);
    render();
   }
  };
 });

 // ── SALVAGUARDAS MODAL ──
 document.querySelectorAll('[data-threat-edit-saves]').forEach(btn => {
  btn.onclick = () => {
   const modal = document.querySelector('#threat-saves-modal');
   if (modal) modal.style.display = 'grid';
  };
 });

 const savesForm = document.querySelector('#threat-saves-form');
 if (savesForm) {
  savesForm.onsubmit = (e) => {
   e.preventDefault();
   const read = (id, fallbackDice) => {
    const manual = savesForm.querySelector(`#threat-save-${id}-manual`)?.checked === true;
    return {
     dados: manual ? Math.max(1, Number(savesForm.querySelector(`#threat-save-${id}-dados`).value) || fallbackDice) : fallbackDice,
     bonus: Number(savesForm.querySelector(`#threat-save-${id}-bonus`).value) || 0,
     manual
    };
   };
   state.salvaguardas = { fortitude: read('fort', 1), reflexos: read('ref', 1), vontade: read('von', 1) };
   applyDerivedDice(state);
   const modal = document.querySelector('#threat-saves-modal');
   if (modal) modal.style.display = 'none';
   save(false);
   render();
  };
 }

 // ── SENTIDOS MODAL ──
 document.querySelectorAll('[data-threat-edit-senses]').forEach(btn => {
  btn.onclick = () => {
   const modal = document.querySelector('#threat-senses-modal');
   if (modal) modal.style.display = 'grid';
  };
 });

 const sensesForm = document.querySelector('#threat-senses-form');
 if (sensesForm) {
  sensesForm.onsubmit = (e) => {
   e.preventDefault();
   const read = (id) => {
    const manual = sensesForm.querySelector(`#threat-sense-${id}-manual`)?.checked === true;
    return {
     dados: Math.max(1, Number(sensesForm.querySelector(`#threat-sense-${id}-dados`).value) || 1),
     bonus: Number(sensesForm.querySelector(`#threat-sense-${id}-bonus`).value) || 0,
     manual
    };
   };
   state.sentidos = {
    percepcao: read('perc'),
    iniciativa: read('inic'),
    extra: sensesForm.querySelector('#threat-sense-extra').value.trim()
   };
   applyDerivedDice(state);
   const modal = document.querySelector('#threat-senses-modal');
   if (modal) modal.style.display = 'none';
   save(false);
   render();
  };
 }

 // ── PERÍCIAS MODAL ──
 function openThreatSkillModal(skill = null) {
  const modal = document.querySelector('#threat-skill-modal');
  if (!modal) return;
  const form = modal.querySelector('#threat-skill-form');
  modal.querySelector('#threat-skill-modal-title').textContent = skill ? 'EDITAR PERÍCIA' : 'NOVA PERÍCIA';
  form.querySelector('#threat-skill-id').value = skill ? skill.id : '';
  form.querySelector('#threat-skill-name-input').value = skill ? skill.nome : '';
  form.querySelector('#threat-skill-dados-input').value = skill ? (skill.dados || 2) : 2;
  form.querySelector('#threat-skill-bonus-input').value = skill ? (skill.bonus ?? 5) : 5;

  const hasCond = !!skill?.condicional;
  const condCheck = form.querySelector('#threat-skill-has-cond');
  condCheck.checked = hasCond;
  const condFields = form.querySelector('#threat-skill-cond-fields');
  condFields.style.display = hasCond ? 'block' : 'none';
  form.querySelector('#threat-skill-cond-text').value = skill?.condicional?.texto || '';
  form.querySelector('#threat-skill-cond-dados').value = skill?.condicional?.dados || '';
  form.querySelector('#threat-skill-cond-bonus').value = (skill?.condicional?.bonus !== undefined && skill?.condicional?.bonus !== null) ? skill.condicional.bonus : '';

  modal.style.display = 'grid';
  form.querySelector('#threat-skill-name-input').focus();
 }

 document.querySelectorAll('[data-threat-add-skill]').forEach(btn => {
  btn.onclick = () => openThreatSkillModal(null);
 });

 document.querySelectorAll('[data-threat-edit-skill]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const skillId = btn.dataset.threatEditSkill;
   const skill = (state.pericias || []).find(p => p.id === skillId);
   if (skill) openThreatSkillModal(skill);
  };
 });

 document.querySelectorAll('[data-threat-del-skill]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const skillId = btn.dataset.threatDelSkill;
   if (confirm('Excluir esta perícia?')) {
    state.pericias = (state.pericias || []).filter(p => p.id !== skillId);
    save(false);
    render();
   }
  };
 });

 const skillForm = document.querySelector('#threat-skill-form');
 if (skillForm) {
  skillForm.onsubmit = (e) => {
   e.preventDefault();
   const skillId = skillForm.querySelector('#threat-skill-id').value;
   const nome = skillForm.querySelector('#threat-skill-name-input').value.trim() || 'Perícia';
   const dados = Math.max(1, Number(skillForm.querySelector('#threat-skill-dados-input').value) || 1);
   const bonus = Number(skillForm.querySelector('#threat-skill-bonus-input').value) || 0;

   const hasCond = skillForm.querySelector('#threat-skill-has-cond').checked;
   let condicional = null;
   if (hasCond) {
    const condText = skillForm.querySelector('#threat-skill-cond-text').value.trim();
    const condDadosRaw = skillForm.querySelector('#threat-skill-cond-dados').value;
    const condBonus = Number(skillForm.querySelector('#threat-skill-cond-bonus').value) || 0;
    condicional = {
     texto: condText || 'Condicional',
     bonus: condBonus
    };
    if (condDadosRaw !== '' && !isNaN(Number(condDadosRaw))) {
     condicional.dados = Math.max(1, Number(condDadosRaw));
    }
   }

   if (!Array.isArray(state.pericias)) state.pericias = [];
   const skillObj = {
    id: skillId || `pericia-${Date.now()}`,
    nome,
    dados,
    bonus,
    condicional
   };

   const existingIdx = state.pericias.findIndex(p => p.id === skillId);
   if (existingIdx >= 0) {
    state.pericias[existingIdx] = skillObj;
   } else {
    state.pericias.push(skillObj);
   }

   const modal = document.querySelector('#threat-skill-modal');
   if (modal) modal.style.display = 'none';
   save(false);
   render();
  };
 }
}


function exportJsonSheet(){
 collectActiveInputs();
 const index=sheets.findIndex(sheet=>sheet.id===state.id);
 if(index>=0)sheets[index]=state;
 const dataStr='data:text/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(state,null,2));
 const a=document.createElement('a');
 const safeName=(state.name||'agente').trim().toLowerCase().replace(/[^\w\d\-_]+/g,'_')||'agente';
 a.setAttribute('href',dataStr);
 a.setAttribute('download',`${safeName}_ficha.json`);
 document.body.appendChild(a);
 a.click();
 a.remove();
 const toast=document.querySelector('#save-toast');
 if(toast){
  toast.textContent='FICHA EXPORTADA';
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),1100);
 }
}

function importJsonSheet(file){
 if(!file)return;
 const reader=new FileReader();
 reader.onload=()=>{
  try{
   const parsed=JSON.parse(reader.result);
   const prepareImport=item=>{
    if(item&&!item.systemMode){
     if(item.vd!==undefined||item.tamanho!==undefined||item.acoes!==undefined){
      item.systemMode='threat';
     }else if(item.atributos?.for!==undefined||item.classeId!==undefined||(item.nex!==undefined&&item.pd===undefined)){
      item.systemMode='original';
     }
    }
    return normalizeSheet(item);
   };
   if(Array.isArray(parsed)){
    if(!parsed.length)throw new Error('Arquivo vazio');
    const imported=parsed.map(prepareImport);
    sheets.push(...imported);
    state=imported[imported.length-1];
    activeSheetId=state.id;
   }else if(parsed&&typeof parsed==='object'){
    const imported=prepareImport(parsed);
    if(sheets.some(s=>s.id===imported.id))imported.id=makeId('sheet');
    sheets.push(imported);
    state=imported;
    activeSheetId=state.id;
   }else{
    throw new Error('Formato inválido');
   }
   save(true,'FICHA IMPORTADA!');
   render();
  }catch(err){
   alert('Erro ao importar JSON: '+(err.message||'formato inválido'));
  }
 };
 reader.readAsText(file);
}

let activeContextMenuSheetId = null;
function showSheetContextMenu(e, sheetId) {
 e.preventDefault();
 e.stopPropagation();
 closeFolderContextMenu();
 activeContextMenuSheetId = sheetId;
 let menu = document.querySelector('#sheet-context-menu');
 if (!menu) {
  menu = document.createElement('div');
  menu.id = 'sheet-context-menu';
  menu.className = 'custom-context-menu';
  document.body.appendChild(menu);
 }
 const target = sheets.find(s => s.id === sheetId);
 const name = target?.name || 'esta ficha';
 const targetIndex = sheets.findIndex(s => s.id === sheetId);
 const canMoveUp = targetIndex > 0;
 const canMoveDown = targetIndex >= 0 && targetIndex < sheets.length - 1;

 function renderDefaultMenu() {
  menu.innerHTML = `
   <div class="custom-context-menu-header">${safe(name)}</div>
   <button type="button" data-action="toggle-fav-sheet">${icon(target?.favorite ? 'star-filled' : 'star', 13)} <span>${target?.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</span></button>
   <button type="button" data-action="open-move-folder-menu">${icon('folder', 13)} <span>Mover para pasta...</span></button>
   ${canMoveUp ? `<button type="button" data-action="move-up-sheet">↑ <span>Mover para cima</span></button>` : ''}
   ${canMoveDown ? `<button type="button" data-action="move-down-sheet">↓ <span>Mover para baixo</span></button>` : ''}
   ${(canMoveUp || canMoveDown) ? `<div class="custom-context-menu-separator"></div>` : ''}
   <button type="button" data-action="clone-sheet">${icon('copy', 13)} <span>Clonar ficha</span></button>
   <div class="custom-context-menu-separator"></div>
   <button type="button" data-action="delete-sheet" class="menu-danger">${icon('trash', 13)} <span>Deletar ficha</span></button>
  `;

  menu.querySelector('[data-action="toggle-fav-sheet"]').onclick = (ev) => {
   ev.stopPropagation();
   closeSheetContextMenu();
   if (target) {
    target.favorite = !target.favorite;
    save(false);
    render();
   }
  };

  menu.querySelector('[data-action="open-move-folder-menu"]').onclick = (ev) => {
   ev.stopPropagation();
   renderMoveFolderMenu();
  };

  const btnUp = menu.querySelector('[data-action="move-up-sheet"]');
  if (btnUp) {
   btnUp.onclick = (ev) => {
    ev.stopPropagation();
    closeSheetContextMenu();
    moveSheet(sheetId, -1);
   };
  }
  const btnDown = menu.querySelector('[data-action="move-down-sheet"]');
  if (btnDown) {
   btnDown.onclick = (ev) => {
    ev.stopPropagation();
    closeSheetContextMenu();
    moveSheet(sheetId, 1);
   };
  }

  menu.querySelector('[data-action="clone-sheet"]').onclick = (ev) => {
   ev.stopPropagation();
   closeSheetContextMenu();
   cloneSheet(sheetId);
  };

  menu.querySelector('[data-action="delete-sheet"]').onclick = (ev) => {
   ev.stopPropagation();
   closeSheetContextMenu();
   deleteSheet(sheetId);
  };
 }

 function renderMoveFolderMenu() {
  menu.innerHTML = `
   <div class="custom-context-menu-header">MOVER PARA PASTA</div>
   <div class="custom-context-menu-folder-list" style="max-height:190px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;">
    ${folders.map(f => `
      <button type="button" data-move-to-fld="${f.id}" style="${target?.folderId === f.id ? 'color:#60a5fa;font-weight:800;' : ''}">
        ${icon(f.icon || 'folder', 13)} <span>${safe(f.name)}${target?.folderId === f.id ? ' (Atual)' : ''}</span>
      </button>
    `).join('')}
   </div>
   <div class="custom-context-menu-separator"></div>
   <button type="button" data-action="back-default-menu">← <span>Voltar</span></button>
  `;

  menu.querySelectorAll('[data-move-to-fld]').forEach(btn => {
   btn.onclick = (ev) => {
    ev.stopPropagation();
    closeSheetContextMenu();
    const newFldId = btn.dataset.moveToFld;
    if (target && target.folderId !== newFldId) {
     target.folderId = newFldId;
     save(true, 'FICHA MOVIDA PARA PASTA');
     render();
    }
   };
  });

  menu.querySelector('[data-action="back-default-menu"]').onclick = (ev) => {
   ev.stopPropagation();
   renderDefaultMenu();
  };
 }

 renderDefaultMenu();
 menu.hidden = false;
 const x = Math.min(window.innerWidth - 190, Math.max(10, e.clientX + 4));
 const y = Math.min(window.innerHeight - 220, Math.max(10, e.clientY + 4));
 menu.style.left = `${x}px`;
 menu.style.top = `${y}px`;
}

function moveSheet(sheetId, delta) {
 const fromIndex = sheets.findIndex(s => s.id === sheetId);
 if (fromIndex < 0) return;
 const toIndex = Math.max(0, Math.min(sheets.length - 1, fromIndex + delta));
 if (fromIndex === toIndex) return;
 const [moved] = sheets.splice(fromIndex, 1);
 sheets.splice(toIndex, 0, moved);
 if (presentationMode) {
  presentationIndex = Math.max(0, getPresentationSheets().findIndex(s => s.id === state.id));
 }
 save(true, 'FICHA MOVIDA');
 render();
}

function closeSheetContextMenu() {
 const menu = document.querySelector('#sheet-context-menu');
 if (menu) menu.hidden = true;
 activeContextMenuSheetId = null;
}

let activeContextMenuFolderId = null;
function showFolderContextMenu(e, folderId) {
 e.preventDefault();
 e.stopPropagation();
 closeSheetContextMenu();
 activeContextMenuFolderId = folderId;
 let menu = document.querySelector('#folder-context-menu');
 if (!menu) {
  menu = document.createElement('div');
  menu.id = 'folder-context-menu';
  menu.className = 'custom-context-menu';
  document.body.appendChild(menu);
 }
 const folder = folders.find(f => f.id === folderId);
 if (!folder) return;
 const isVisibleInRail = appSettings.sidebarVisibleFolderIds.length === 0 || appSettings.sidebarVisibleFolderIds.includes(folderId);

 menu.innerHTML = `
  <div class="custom-context-menu-header">${safe(folder.name)}</div>
  <button type="button" data-action="new-sheet-folder">${icon('plus', 13)} <span>Nova ficha nesta pasta</span></button>
  <button type="button" data-action="toggle-rail-visibility">${icon(isVisibleInRail ? 'eye-off' : 'eye', 13)} <span>${isVisibleInRail ? 'Ocultar no Rail lateral' : 'Exibir no Rail lateral'}</span></button>
  ${!folder.system ? `
    <div class="custom-context-menu-separator"></div>
    <button type="button" data-action="rename-folder">${icon('edit', 13)} <span>Renomear pasta</span></button>
    <button type="button" data-action="delete-folder" class="menu-danger">${icon('trash', 13)} <span>Excluir pasta</span></button>
  ` : ''}
 `;
 menu.hidden = false;
 const x = Math.min(window.innerWidth - 190, Math.max(10, e.clientX + 4));
 const y = Math.min(window.innerHeight - 170, Math.max(10, e.clientY + 4));
 menu.style.left = `${x}px`;
 menu.style.top = `${y}px`;

 menu.querySelector('[data-action="new-sheet-folder"]').onclick = (ev) => {
  ev.stopPropagation();
  closeFolderContextMenu();
  targetFolderForNewSheet = folderId;
  const modal = document.querySelector('#system-select-modal');
  if (modal) modal.style.display = 'flex';
 };

 menu.querySelector('[data-action="toggle-rail-visibility"]').onclick = (ev) => {
  ev.stopPropagation();
  closeFolderContextMenu();
  toggleFolderRailVisibility(folderId);
 };

 const btnRename = menu.querySelector('[data-action="rename-folder"]');
 if (btnRename) {
  btnRename.onclick = (ev) => {
   ev.stopPropagation();
   closeFolderContextMenu();
   const newName = prompt('Novo nome para a pasta:', folder.name);
   if (newName && newName.trim() && newName.trim() !== folder.name) {
    folders = updateFolder(folders, folderId, { name: newName.trim() });
    persistFoldersToStorage(folders, { idbSet });
    render();
   }
  };
 }

 const btnDelete = menu.querySelector('[data-action="delete-folder"]');
 if (btnDelete) {
  btnDelete.onclick = (ev) => {
   ev.stopPropagation();
   closeFolderContextMenu();
   if (confirm(`Deseja excluir a pasta "${folder.name}"? As fichas não serão apagadas.`)) {
    const res = deleteFolder(folders, sheets, folderId);
    folders = res.folders;
    sheets = res.sheets;
    persistFoldersToStorage(folders, { idbSet });
    save(false);
    render();
   }
  };
 }
}

function closeFolderContextMenu() {
 const menu = document.querySelector('#folder-context-menu');
 if (menu) menu.hidden = true;
 activeContextMenuFolderId = null;
}

function toggleFolderRailVisibility(folderId) {
 if (!appSettings.sidebarVisibleFolderIds || appSettings.sidebarVisibleFolderIds.length === 0) {
  appSettings.sidebarVisibleFolderIds = folders.map(f => f.id).filter(id => id !== folderId);
 } else if (appSettings.sidebarVisibleFolderIds.includes(folderId)) {
  appSettings.sidebarVisibleFolderIds = appSettings.sidebarVisibleFolderIds.filter(id => id !== folderId);
  if (appSettings.sidebarVisibleFolderIds.length === folders.length) {
   appSettings.sidebarVisibleFolderIds = [];
  }
 } else {
  appSettings.sidebarVisibleFolderIds.push(folderId);
  if (appSettings.sidebarVisibleFolderIds.length === folders.length) {
   appSettings.sidebarVisibleFolderIds = [];
  }
 }
 saveAppSettings();
 render();
}

function switchToSheet(targetId) {
 if (!targetId) return;
 trackRecentSheet(targetId);
 sheetDrawerOpen = false;
 if (!sidebarNavigatorPinned) {
  sidebarNavigatorOpen = false;
  appSettings.sidebarNavigatorOpen = false;
  saveAppSettings();
 }
 if (targetId === state.id) { render(); return; }
 if (editMode || dirtySheets.has(state.id)) {
  save(false);
 } else {
  collectActiveInputs();
 }
 editMode = false;
 const doSwitch = () => {
  state = sheets.find(sheet => sheet.id === targetId) || state;
  activeSheetId = state.id;
  try {
   localStorage.setItem('ordem-ii-active-sheet', state.id);
   idbSet('activeSheetId', state.id);
  } catch {}
  if (presentationMode) {
   if (state.systemMode === 'threat') {
    presentationMode = false;
   } else {
    presentationIndex = Math.max(0, getPresentationSheets().findIndex(s => s.id === state.id));
    if (state.viewMode !== 'vigilia') {
     state.viewMode = 'cinematic';
    }
   }
  }
  render();
 };
 const targetSheet = sheets.find(sh => sh.id === targetId);
 const isVigilia = state.viewMode === 'vigilia' || targetSheet?.viewMode === 'vigilia';
 if (state.viewMode === 'cinematic' || isVigilia || presentationMode || state.systemMode === 'threat' || targetSheet?.systemMode === 'threat') {
  triggerGlitchTransition(doSwitch);
 } else {
  doSwitch();
 }
}

function updateNavigatorTreeOnly() {
 const container = document.querySelector('#workspace-navigator .nav-tree-scroll');
 if (!container) return;
 container.innerHTML = renderNavigatorTreeContent(folders, sheets, state.id, {
  searchQuery: sidebarSearchQuery,
  scope: sidebarScope,
  visibleFolderIds: appSettings.sidebarVisibleFolderIds,
  recentSheetIds: appSettings.recentSheetIds,
  threatElement: threatFilterElement,
  threatVdRange: threatFilterVdRange,
  threatVdMin: threatFilterVdMin,
  threatVdMax: threatFilterVdMax,
  threatCategory: threatFilterCategory,
  threatSort: threatSort,
  threatGroupBy: threatGroupBy,
  virtualGroupsCollapsed: virtualGroupsCollapsed,
  safeUrl
 });
 bindNavigatorTreeEvents(container);
}

function updateThreatPanelCountsOnly() {
 const panel = document.querySelector('#nav-threat-filter-panel');
 if (!panel) return;
 const threats = sheets.filter(isThreatSheet);
 const matchingThreats = visibleSheets(threats, [], {
  scope: 'threats',
  threatElement: threatFilterElement,
  threatVdRange: threatFilterVdRange,
  threatVdMin: threatFilterVdMin,
  threatVdMax: threatFilterVdMax,
  threatCategory: threatFilterCategory
 });
 const hasActiveFilters = threatFilterElement !== 'all' ||
  threatVdRange !== 'all' ||
  (threatFilterVdMin !== '' && !isNaN(Number(threatFilterVdMin))) ||
  (threatFilterVdMax !== '' && !isNaN(Number(threatFilterVdMax))) ||
  threatCategory !== 'all';

 const badge = panel.querySelector('.nav-threat-active-badge, .nav-threat-total-badge');
 if (badge) {
  if (hasActiveFilters) {
   badge.className = 'nav-threat-active-badge';
   badge.textContent = `${matchingThreats.length}/${threats.length}`;
  } else {
   badge.className = 'nav-threat-total-badge';
   badge.textContent = `${threats.length}`;
  }
 }

 const headerRight = panel.querySelector('.nav-threat-header-right');
 if (headerRight) {
  const clearBtn = headerRight.querySelector('[data-clear-threat-filters]');
  if (clearBtn) {
   clearBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';
  }
 }

 const customInputs = panel.querySelector('.custom-vd-inputs');
 if (customInputs) {
  const miniClear = customInputs.querySelector('[data-clear-custom-vd]');
  const hasCustom = threatFilterVdMin !== '' || threatFilterVdMax !== '';
  if (miniClear) {
   miniClear.style.display = hasCustom ? 'grid' : 'none';
  }
 }
}

function updateRailSwitcherOnly() {
 const railSwitcher = document.querySelector('.compact-rail .sheet-switcher');
 if (!railSwitcher) return;
 const tempDiv = document.createElement('div');
 tempDiv.innerHTML = renderRailSwitcher(sheets, folders, state.id, {
  scope: sidebarScope,
  visibleFolderIds: appSettings.sidebarVisibleFolderIds,
  threatElement: threatFilterElement,
  threatVdRange: threatFilterVdRange,
  threatVdMin: threatFilterVdMin,
  threatVdMax: threatFilterVdMax,
  threatCategory: threatFilterCategory,
  threatSort: threatSort,
  safeUrl
 });
 const newSwitcher = tempDiv.firstElementChild;
 if (newSwitcher) {
  railSwitcher.replaceWith(newSwitcher);
  newSwitcher.querySelectorAll('[data-sheet-id]').forEach(btn => {
   btn.onclick = () => switchToSheet(btn.dataset.sheetId);
  });
  newSwitcher.querySelectorAll('[data-clear-threat-filters]').forEach(btn => {
   btn.onclick = (e) => {
    e.stopPropagation();
    threatFilterElement = 'all';
    threatFilterVdRange = 'all';
    threatFilterVdMin = '';
    threatFilterVdMax = '';
    threatFilterCategory = 'all';
    appSettings.threatFilterElement = 'all';
    appSettings.threatFilterVdRange = 'all';
    appSettings.threatFilterVdMin = '';
    appSettings.threatFilterVdMax = '';
    appSettings.threatFilterCategory = 'all';
    saveAppSettings();
    render();
   };
  });
 }
}

function updateMobileDrawerOnly() {
 const container = document.querySelector('.sheet-drawer .sheet-drawer-list');
 if (!container) return;
 const isSearching = Boolean(mobileSearchQuery && mobileSearchQuery.trim());
 if (isSearching) {
  container.innerHTML = renderNavigatorTreeContent(folders, sheets, state.id, {
   searchQuery: mobileSearchQuery,
   scope: 'all',
   safeUrl
  });
 } else {
  container.innerHTML = renderNavigatorTreeContent(folders, sheets, state.id, {
   searchQuery: '',
   scope: 'all',
   safeUrl
  });
 }
 bindNavigatorTreeEvents(container);
}

function bindNavigatorTreeEvents(container = document) {
 container.querySelectorAll('[data-toggle-virtual-group]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const gId = el.dataset.toggleVirtualGroup;
   if (gId) {
    virtualGroupsCollapsed[gId] = !virtualGroupsCollapsed[gId];
    appSettings.virtualGroupsCollapsed = virtualGroupsCollapsed;
    saveAppSettings();
    updateNavigatorTreeOnly();
   }
  };
 });

 container.querySelectorAll('[data-toggle-folder-id], [data-folder-click-toggle]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const folderId = el.dataset.toggleFolderId || el.dataset.folderClickToggle;
   const f = folders.find(item => item.id === folderId);
   if (f) {
    f.collapsed = !f.collapsed;
    persistFoldersToStorage(folders, { idbSet });
    render();
   }
  };
 });

 container.querySelectorAll('[data-select-sheet-id]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   switchToSheet(el.dataset.selectSheetId);
  };
 });

 container.querySelectorAll('[data-toggle-fav-sheet]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const sId = el.dataset.toggleFavSheet;
   const s = sheets.find(item => item.id === sId);
   if (s) {
    s.favorite = !s.favorite;
    save(false);
    render();
   }
  };
 });

 container.querySelectorAll('[data-toggle-visibility-folder]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   toggleFolderRailVisibility(el.dataset.toggleVisibilityFolder);
  };
 });

 container.querySelectorAll('[data-sheet-menu-btn]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   showSheetContextMenu(e, el.dataset.sheetMenuBtn);
  };
 });

 container.querySelectorAll('.nav-sheet-item').forEach(el => {
  el.oncontextmenu = (e) => {
   e.stopPropagation();
   showSheetContextMenu(e, el.dataset.navSheetRow);
  };
 });

 container.querySelectorAll('[data-folder-menu-btn]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   showFolderContextMenu(e, el.dataset.folderMenuBtn);
  };
 });

 container.querySelectorAll('.nav-folder-header').forEach(el => {
  el.oncontextmenu = (e) => {
   e.stopPropagation();
   showFolderContextMenu(e, el.dataset.folderHeaderId);
  };
 });

 container.querySelectorAll('.nav-sheet-item').forEach(item => {
  item.ondragstart = (e) => {
   const sheetId = item.dataset.navSheetRow;
   draggedSheetId = sheetId;
   isDraggingSheet = true;
   try {
    e.dataTransfer.setData('text/sheet-id', sheetId);
    e.dataTransfer.setData('text/plain', sheetId);
   } catch {}
   e.dataTransfer.effectAllowed = 'move';
   item.classList.add('dragging');
  };
  item.ondragend = () => {
   item.classList.remove('dragging');
   setTimeout(() => {
    isDraggingSheet = false;
    draggedSheetId = null;
   }, 100);
  };
 });

 container.querySelectorAll('[data-folder-drop-zone], [data-folder-header-id]').forEach(zone => {
  zone.ondragover = (e) => {
   e.preventDefault();
   e.stopPropagation();
   e.dataTransfer.dropEffect = 'move';
   zone.classList.add('folder-drag-over');
  };
  zone.ondragleave = (e) => {
   e.stopPropagation();
   zone.classList.remove('folder-drag-over');
  };
  zone.ondrop = (e) => {
   e.preventDefault();
   e.stopPropagation();
   zone.classList.remove('folder-drag-over');
   const targetFolderId = zone.dataset.folderDropZone || zone.dataset.folderHeaderId;
   const sheetId = e.dataTransfer.getData('text/sheet-id') || draggedSheetId;
   if (sheetId && targetFolderId) {
    const sheet = sheets.find(s => s.id === sheetId);
    if (sheet && sheet.folderId !== targetFolderId) {
     sheet.folderId = targetFolderId;
     save(true, 'FICHA MOVIDA PARA PASTA');
     render();
    }
   }
  };
 });
}

function bindQuickSwitcherEvents() {
 if (!quickSwitcherOpen) return;
 const modal = document.querySelector('#quick-switcher-modal');
 if (!modal) return;

 modal.querySelectorAll('[data-close-quick-switcher]').forEach(el => {
  el.onclick = () => {
   quickSwitcherOpen = false;
   render();
  };
 });

 const qsInput = modal.querySelector('[data-qs-input]');
 if (qsInput) {
  qsInput.oninput = (e) => {
   quickSwitcherQuery = e.target.value;
   quickSwitcherIndex = 0;
   const { count, html } = renderQuickSwitcherResults(sheets, folders, quickSwitcherQuery, quickSwitcherIndex, safeUrl);
   const rBox = modal.querySelector('.quick-switcher-results');
   if (rBox) rBox.innerHTML = html;
   const cBox = modal.querySelector('.quick-switcher-count');
   if (cBox) cBox.textContent = `${count} fichas`;
   bindQuickSwitcherItemEvents();
  };
 }
 bindQuickSwitcherItemEvents();
}

function bindQuickSwitcherItemEvents() {
 const container = document.querySelector('.quick-switcher-results');
 if (!container) return;
 container.querySelectorAll('.quick-switcher-item').forEach(item => {
  item.onclick = (e) => {
   e.stopPropagation();
   const sheetId = item.dataset.qsSheetId;
   if (sheetId) {
    quickSwitcherOpen = false;
    switchToSheet(sheetId);
   }
  };
 });
}

// Controles de edição do layout "A Vigília": nome, perícias, relações, retrato e fundo
const VIGILIA_RANGE_DEFAULTS = { vigiliaTokenScale: 100, vigiliaTokenX: 0, vigiliaTokenY: 0, vigiliaBgBlur: 0, vigiliaBgZoom: 100, vigiliaBgDim: 0 };
const VIGILIA_RANGE_VARS = {
 vigiliaTokenScale: ['--vg-token-scale', v => v / 100, v => `${v}%`],
 vigiliaTokenX: ['--vg-token-x', v => `${v}%`, v => `${v}%`],
 vigiliaTokenY: ['--vg-token-y', v => `${v}%`, v => `${v}%`],
 vigiliaBgBlur: ['--vg-bg-blur', v => `${v}px`, v => `${v}px`],
 vigiliaBgZoom: ['--vg-bg-zoom', v => v / 100, v => `${v}%`],
 vigiliaBgDim: ['--vg-bg-dim', v => v / 100, v => `${v}%`]
};

function applyVigiliaRangeVar(key, value) {
 const cfg = VIGILIA_RANGE_VARS[key];
 const page = document.querySelector('.vigilia-page');
 if (!cfg || !page) return;
 page.style.setProperty(cfg[0], String(cfg[1](value)));
 const hint = document.querySelector(`[data-vigilia-range="${key}"]`)?.parentElement?.querySelector('em');
 if (hint) hint.textContent = cfg[2](value);
}

function bindVigiliaEditEvents() {
 if (!editMode) return;

 // Nome em duas partes (primeiro nome grande + sobrenome/título)
 document.querySelectorAll('[data-vigilia-name]').forEach(input => {
  input.onchange = () => {
   const first = document.querySelector('[data-vigilia-name="first"]')?.value.trim() || '';
   const last = document.querySelector('[data-vigilia-name="last"]')?.value.trim() || '';
   state.firstName = first.toUpperCase();
   state.lastName = last.toUpperCase();
   state.name = [first, last].filter(Boolean).join(' ') || 'SEM NOME';
   save(false);
   render();
  };
 });

 // Controles dentro da linha de perícia não devem disparar a rolagem
 document.querySelectorAll('.vigilia-skill-row [data-vigilia-stop], .vigilia-skill-row .skill-name-input, .vigilia-skill-row .skill-name-aptidao').forEach(el => {
  el.addEventListener('click', e => e.stopPropagation());
 });

 // Seletor de grau do dado da perícia (d4 → d12)
 document.querySelectorAll('.custom-select[data-select-id^="vigilia-skill-die:"]').forEach(select => {
  select.querySelectorAll('.select-option').forEach(option => {
   option.onclick = e => {
    e.stopPropagation();
    const idx = Number(select.dataset.selectId.split(':')[1]);
    const sides = Number(option.dataset.selectValue) || 4;
    const skill = state.skills?.[idx];
    if (!skill) return;
    skill.skillDie = sides;
    skill.training = (VIGILIA_SKILL_GRADES.find(([v]) => v === sides) || [sides, 'TREINADO'])[1];
    select.classList.remove('open');
    save(false);
    render();
   };
  });
 });

 document.querySelectorAll('[data-vigilia-skill-name]').forEach(input => {
  input.onchange = () => {
   const skill = state.skills?.[Number(input.dataset.vigiliaSkillName)];
   if (!skill) return;
   skill.name = input.value.trim().toUpperCase() || 'PERÍCIA';
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-vigilia-remove-skill]').forEach(btn => {
  btn.onclick = e => {
   e.stopPropagation();
   const idx = Number(btn.dataset.vigiliaRemoveSkill);
   const skill = state.skills?.[idx];
   if (!skill || !confirm(`Remover a perícia "${skill.name}"?`)) return;
   state.skills.splice(idx, 1);
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-vigilia-add-skill]').forEach(btn => {
  btn.onclick = () => {
   if (!Array.isArray(state.skills)) state.skills = [];
   state.skills.push({ name: 'NOVA PERÍCIA', skillDie: 4, training: 'DESTREINADO', attribute: 'Mente', extra: 0 });
   save(false);
   render();
   const inputs = document.querySelectorAll('[data-vigilia-skill-name]');
   const last = inputs[inputs.length - 1];
   if (last) { last.scrollIntoView({ block: 'nearest' }); last.select(); }
  };
 });

 // Relações (verso)
 document.querySelectorAll('[data-vigilia-rel]').forEach(input => {
  input.onchange = () => {
   const [idxStr, field] = input.dataset.vigiliaRel.split(':');
   const rel = state.relations?.[Number(idxStr)];
   if (!rel) return;
   rel[field] = field === 'note' ? input.value.trim() : input.value.trim().toUpperCase();
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-vigilia-remove-relation]').forEach(btn => {
  btn.onclick = e => {
   e.stopPropagation();
   const idx = Number(btn.dataset.vigiliaRemoveRelation);
   const rel = state.relations?.[idx];
   if (!rel || !confirm(`Remover a relação com "${rel.target || 'sem nome'}"?`)) return;
   state.relations.splice(idx, 1);
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-vigilia-add-relation]').forEach(btn => {
  btn.onclick = () => {
   if (!Array.isArray(state.relations)) state.relations = [];
   state.relations.push({ target: `NOVO ${state.relations.length + 1}`, degree: 0, feeling: 'NEUTRO', note: '' });
   save(false);
   render();
  };
 });

 // Retrato e fundo
 document.querySelectorAll('[data-vigilia-remove-token]').forEach(btn => {
  btn.onclick = () => { state.tokenImage = ''; save(false); render(); };
 });
 document.querySelectorAll('[data-vigilia-reset-token]').forEach(btn => {
  btn.onclick = () => { state.vigiliaTokenScale = 100; state.vigiliaTokenX = 0; state.vigiliaTokenY = 0; save(false); render(); };
 });
 document.querySelectorAll('[data-vigilia-reset-bg]').forEach(btn => {
  btn.onclick = () => {
   state.vigiliaBackground = '';
   state.backgroundImage = '';
   state.vigiliaBgBlur = 0;
   state.vigiliaBgZoom = 100;
   state.vigiliaBgDim = 0;
   save(false);
   render();
  };
 });
 document.querySelectorAll('[data-vigilia-toggle]').forEach(btn => {
  btn.onclick = () => { const key = btn.dataset.vigiliaToggle; state[key] = !state[key]; save(false); render(); };
 });
 const bgUpload = document.querySelector('#vigilia-bg-upload');
 if (bgUpload) bgUpload.onchange = () => readImage(bgUpload.files[0], 'vigiliaBackground', 2400);

 document.querySelectorAll('[data-vigilia-range]').forEach(input => {
  const key = input.dataset.vigiliaRange;
  input.oninput = () => {
   state[key] = Number(input.value) || 0;
   applyVigiliaRangeVar(key, state[key]);
  };
  input.onchange = () => save(false);
  input.ondblclick = () => {
   state[key] = VIGILIA_RANGE_DEFAULTS[key] ?? 0;
   input.value = state[key];
   applyVigiliaRangeVar(key, state[key]);
   save(false);
  };
 });

 // Arrastar o retrato para reposicionar
 const token = document.querySelector('[data-vigilia-token]');
 const area = document.querySelector('[data-vigilia-portrait-area]');
 if (token && area) {
  token.onpointerdown = event => {
   event.preventDefault();
   const rect = area.getBoundingClientRect();
   const startX = event.clientX, startY = event.clientY;
   const originX = Number(state.vigiliaTokenX) || 0, originY = Number(state.vigiliaTokenY) || 0;
   token.setPointerCapture(event.pointerId);
   token.classList.add('dragging');
   token.onpointermove = move => {
    state.vigiliaTokenX = Math.round(Math.max(-60, Math.min(60, originX + (move.clientX - startX) / rect.width * 100)));
    state.vigiliaTokenY = Math.round(Math.max(-60, Math.min(60, originY + (move.clientY - startY) / rect.height * 100)));
    applyVigiliaRangeVar('vigiliaTokenX', state.vigiliaTokenX);
    applyVigiliaRangeVar('vigiliaTokenY', state.vigiliaTokenY);
    const xIn = document.querySelector('[data-vigilia-range="vigiliaTokenX"]');
    const yIn = document.querySelector('[data-vigilia-range="vigiliaTokenY"]');
    if (xIn) xIn.value = state.vigiliaTokenX;
    if (yIn) yIn.value = state.vigiliaTokenY;
   };
   token.onpointerup = () => {
    token.classList.remove('dragging');
    token.onpointermove = null;
    save(false);
   };
  };
  // Roda do mouse sobre o retrato ajusta a escala
  token.onwheel = e => {
   e.preventDefault();
   const cur = Number(state.vigiliaTokenScale) || 100;
   state.vigiliaTokenScale = Math.max(30, Math.min(200, cur + (e.deltaY < 0 ? 4 : -4)));
   applyVigiliaRangeVar('vigiliaTokenScale', state.vigiliaTokenScale);
   const sIn = document.querySelector('[data-vigilia-range="vigiliaTokenScale"]');
   if (sIn) sIn.value = state.vigiliaTokenScale;
   clearTimeout(token._wheelSave);
   token._wheelSave = setTimeout(() => save(false), 300);
  };
 }
}

function bindVigiliaEvents() {
 if (state.viewMode !== 'vigilia') return;

 bindVigiliaEditEvents();

 document.querySelectorAll('[data-vigilia-side]').forEach(btn => {
  btn.onclick = () => {
   setVigiliaSide(btn.dataset.vigiliaSide);
   render();
  };
 });

 document.querySelectorAll('[data-set-relation]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const [target, degStr] = btn.dataset.setRelation.split(':');
   const degree = Number(degStr) || 0;
   if (!Array.isArray(state.relations)) state.relations = [];
   let rel = state.relations.find(r => r.target === target);
   if (!rel) {
    rel = { target, degree, feeling: 'NEUTRO', note: '' };
    state.relations.push(rel);
   } else {
    rel.degree = degree;
   }
   save(false);
   render();
  };
 });

 document.querySelectorAll('[data-reset-relations]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   if (Array.isArray(state.relations)) {
    state.relations.forEach(r => r.invoked = false);
    save(false);
    render();
    const toast = document.querySelector('#save-toast');
    if (toast) {
     toast.textContent = 'RELAÇÕES REINICIADAS PARA NOVA MISSÃO';
     toast.classList.add('show');
     setTimeout(() => toast.classList.remove('show'), 1800);
    }
   }
  };
 });

 document.querySelectorAll('[data-invoke-relation]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const [target, degStr] = btn.dataset.invokeRelation.split(':');
   const degree = Number(degStr) || 1;
   const rel = state.relations?.find(r => r.target === target) || { target, degree, feeling: 'AMIZADE', note: '' };
   const modal = document.querySelector('#vigilia-relation-modal');
   const container = document.querySelector('#vigilia-relation-modal-content');
   if (!modal || !container) return;
   const benefits = getRelationBenefits(degree);
   container.innerHTML = `
     <div class="relation-modal-detail-card">
       <h3>${safe(rel.target)} (Grau ${degree})</h3>
       <p><strong>${safe(rel.feeling)}:</strong> ${safe(rel.note || '')}</p>
       ${rel.invoked ? '<p style="color:#f59e0b;font-weight:700;">⚠ Esta relação já foi invocada nesta missão.</p>' : ''}
     </div>
     <div class="relation-modal-options">
       ${benefits.map(b => `
         <button type="button" class="relation-option-btn" data-trigger-benefit="${b.id}" data-target="${safe(rel.target)}" data-degree="${degree}">
           <strong>${safe(b.label)}</strong>
           <small>${safe(b.desc)}</small>
         </button>
       `).join('')}
     </div>
   `;
   modal.style.display = 'flex';

   container.querySelectorAll('[data-trigger-benefit]').forEach(optBtn => {
    optBtn.onclick = async () => {
     const bId = optBtn.dataset.triggerBenefit;
     modal.style.display = 'none';
     rel.invoked = true;
     save(false);
     render();
     if (bId === 'bonus_test' || bId === 'bonus_help') {
      const d = degree === 1 ? 6 : degree === 2 ? 8 : 12;
      roll(`Invocação: ${bId === 'bonus_test' ? 'Bônus no Teste' : 'Bônus em Ajudar'} (${rel.target})`, [d], 0);
     } else if (bId === 'motivate_pd') {
      const sides = degree === 2 ? [4, 4] : [6, 6];
      const res = await roll(`Invocação: Motivar (${rel.target})`, sides, 0);
      if (res && res.total) {
       state.pd = Math.min(state.maxPd, state.pd + res.total);
       updateResourceUi('pd');
       save(false);
       render();
       const toast = document.querySelector('#save-toast');
       if (toast) {
        toast.textContent = `MOTIVADO: +${res.total} PD RECUPERADOS!`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
       }
      }
     } else if (bId === 'extra_action') {
      alert(`Ação Extra ativada para proteger ${rel.target}! Você tem 1 ação adicional neste turno.`);
     }
    };
   });
  };
 });

 document.querySelectorAll('[data-spend-armor]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const pts = state.armorPoints ?? (state.pontosArmadura ?? 0);
   if (pts > 0) {
    state.armorPoints = pts - 1;
    save(false);
    render();
    const toast = document.querySelector('#save-toast');
    if (toast) {
     toast.textContent = '1 PONTO DE ARMADURA GASTO (-10 DANO)';
     toast.classList.add('show');
     setTimeout(() => toast.classList.remove('show'), 2000);
    }
   } else {
    alert('Nenhum ponto de armadura disponível para gastar.');
   }
  };
 });

 document.querySelectorAll('[data-armor-step]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const delta = Number(btn.dataset.armorStep) || 0;
   const cur = state.armorPoints ?? (state.pontosArmadura ?? 0);
   const next = Math.max(0, cur + delta);
   if (next !== cur) {
    state.armorPoints = next;
    save(false);
    render();
    const toast = document.querySelector('#save-toast');
    if (toast) {
     toast.textContent = delta > 0 ? `ARMADURA: +1 (${next} PA)` : `ARMADURA: -1 (${next} PA)`;
     toast.classList.add('show');
     setTimeout(() => toast.classList.remove('show'), 1500);
    }
   }
  };
 });

 document.querySelectorAll('[data-pavor-action]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const action = btn.dataset.pavorAction;
   if (action === 'trigger') {
    state.dadoPavor = stepUpPavor(state.dadoPavor);
    save(false);
    render();
    const toast = document.querySelector('#save-toast');
    if (toast) {
     toast.textContent = `DADO DE PAVOR ATIVADO: d${state.dadoPavor}`;
     toast.classList.add('show');
     setTimeout(() => toast.classList.remove('show'), 2000);
    }
   } else if (action === 'control') {
    if (state.pd >= 1) {
     state.pd -= 1;
     state.dadoPavor = stepDownPavor(state.dadoPavor);
     updateResourceUi('pd');
     save(false);
     render();
     const toast = document.querySelector('#save-toast');
     if (toast) {
      toast.textContent = 'PAVOR CONTROLADO (-1 PD)';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
     }
    } else {
     alert('Pontos de Determinação insuficientes para controlar o pavor (necessário 1 PD).');
    }
   } else if (action === 'embrace') {
    if (state.pd >= 5) {
     state.pd -= 5;
     state.pavorEmbraced = true;
     updateResourceUi('pd');
     save(false);
     render();
     const toast = document.querySelector('#save-toast');
     if (toast) {
      toast.textContent = 'PAVOR ABRAÇADO (-5 PD): O dado será convertido em bônus no próximo teste!';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
     }
    } else {
     alert('Pontos de Determinação insuficientes para abraçar o pavor (necessário 5 PD).');
    }
   } else if (action === 'clear') {
    state.dadoPavor = null;
    state.pavorEmbraced = false;
    save(false);
    render();
    const toast = document.querySelector('#save-toast');
    if (toast) {
     toast.textContent = 'PAVOR SUPERADO!';
     toast.classList.add('show');
     setTimeout(() => toast.classList.remove('show'), 1800);
    }
   }
  };
 });

 document.querySelectorAll('[data-open-vigilia-modal]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const modalId = `vigilia-${btn.dataset.openVigiliaModal}-modal`;
   const modal = document.querySelector(`#${modalId}`);
   if (modal) modal.style.display = 'flex';
  };
 });

 document.querySelectorAll('[data-close-vigilia-modal]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   document.querySelectorAll('.vigilia-modal-backdrop').forEach(m => m.style.display = 'none');
  };
 });

 document.querySelectorAll('[data-roll-lesao-check]').forEach(btn => {
  btn.onclick = async (e) => {
   e.stopPropagation();
   const [diceStr, dtStr] = btn.dataset.rollLesaoCheck.split('|');
   const [attrDie, skillDie] = diceStr.split(',').map(Number);
   const dt = Number(dtStr) || 7;
   const modal = document.querySelector('#vigilia-lesao-modal');
   if (modal) modal.style.display = 'none';
   const res = await roll(`Teste de Lesão (DT ${dt})`, [attrDie, skillDie], 0);
   if (res && res.values) {
    state.lesoesCountScene = (state.lesoesCountScene || 0) + 1;
    save(false);
    const [d1, d2] = res.values;
    const total = d1 + d2;
    const isCrit = d1 === d2 && d1 >= 6;
    const isFumble = d1 === 1 && d2 === 1;
    setTimeout(() => {
     if (isCrit) {
      state.pv = Math.max(1, state.pv + 1);
      updateResourceUi('pv');
      save(false);
      render();
      alert('★ SUCESSO CRÍTICO NO TESTE DE LESÃO!\nVocê recupera 1 PV e se recupera das condições Inconsciente e Moribundo!');
     } else if (isFumble) {
      alert('☠ FALHA CRÍTICA NO TESTE DE LESÃO!\nVocê morreu. Hora de criar um novo personagem.');
     } else if (total >= dt) {
      alert(`✓ SUCESSO NO TESTE DE LESÃO (${total} vs DT ${dt})!\nVocê fica Inconsciente e Moribundo (estável aguardando socorro).`);
     } else {
      alert(`✕ FALHA NO TESTE DE LESÃO (${total} vs DT ${dt})!\nVocê deve rolar na Tabela de Lesões (1d20).`);
      if (modal) modal.style.display = 'flex';
     }
    }, 800);
   }
  };
 });

 document.querySelectorAll('[data-roll-trauma-check]').forEach(btn => {
  btn.onclick = async (e) => {
   e.stopPropagation();
   const [diceStr, dtStr] = btn.dataset.rollTraumaCheck.split('|');
   const [attrDie, skillDie] = diceStr.split(',').map(Number);
   const dt = Number(dtStr) || 7;
   const modal = document.querySelector('#vigilia-trauma-modal');
   if (modal) modal.style.display = 'none';
   const res = await roll(`Teste de Trauma (DT ${dt})`, [attrDie, skillDie], 0);
   if (res && res.values) {
    state.traumasCountScene = (state.traumasCountScene || 0) + 1;
    save(false);
    const [d1, d2] = res.values;
    const total = d1 + d2;
    const isCrit = d1 === d2 && d1 >= 6;
    const isFumble = d1 === 1 && d2 === 1;
    setTimeout(() => {
     if (isCrit) {
      state.pd = Math.max(1, state.pd + 1);
      updateResourceUi('pd');
      save(false);
      render();
      alert('★ SUCESSO CRÍTICO NO TESTE DE TRAUMA!\nVocê supera o choque imediato e recupera 1 PD!');
     } else if (isFumble) {
      alert('☠ FALHA CRÍTICA NO TESTE DE TRAUMA!\nColapso mental total: sua mente se estilhaça diante do horror.');
     } else if (total >= dt) {
      alert(`✓ SUCESSO NO TESTE DE TRAUMA (${total} vs DT ${dt})!\nVocê está abalado, mas resiste sem traumas permanentes.`);
     } else {
      alert(`✕ FALHA NO TESTE DE TRAUMA (${total} vs DT ${dt})!\nVocê deve rolar na Tabela de Traumas (1d20).`);
      if (modal) modal.style.display = 'flex';
     }
    }, 800);
   }
  };
 });

 const applyLesaoChoice = (outcome, rollLabel = '') => {
  state.lesoesCountScene = (state.lesoesCountScene || 0) + 1;
  if (outcome.pvBonus) {
   state.pv = Math.max(1, state.pv + outcome.pvBonus);
   updateResourceUi('pv');
  }
  state.cards = Array.isArray(state.cards) ? state.cards : [];
  state.cards.push(normalizeCard({
   id: makeId('card'),
   schema: 'abilities',
   title: outcome.name,
   type: 'Lesão',
   content: outcome.desc,
   accent: '#e0150d',
   themeLinked: false,
   markers: [],
   actions: []
  }));
  save(false);
  render();
  const prefix = rollLabel ? `[${rollLabel}] ` : '';
  alert(`✓ LESÃO APLICADA: ${prefix}${outcome.name.toUpperCase()}\n\n${outcome.desc}\n\n(Adicionada às Habilidades da ficha e DT da próxima lesão na cena aumentada para ${7 + 3 * state.lesoesCountScene})`);
 };

 const applyTraumaChoice = (outcome, rollLabel = '') => {
  state.traumasCountScene = (state.traumasCountScene || 0) + 1;
  if (outcome.pavor) {
   state.dadoPavor = stepUpPavor(state.dadoPavor);
  }
  if (outcome.pdBonus) {
   state.pd = Math.max(1, state.pd + outcome.pdBonus);
   updateResourceUi('pd');
  }
  state.cards = Array.isArray(state.cards) ? state.cards : [];
  state.cards.push(normalizeCard({
   id: makeId('card'),
   schema: 'abilities',
   title: outcome.name,
   type: 'Trauma',
   content: outcome.desc,
   accent: '#8b5cf6',
   themeLinked: false,
   markers: [],
   actions: []
  }));
  save(false);
  render();
  const prefix = rollLabel ? `[${rollLabel}] ` : '';
  alert(`✓ TRAUMA APLICADO: ${prefix}${outcome.name.toUpperCase()}\n\n${outcome.desc}\n\n(Adicionado às Habilidades da ficha e DT do próximo trauma na cena aumentada para ${7 + 3 * state.traumasCountScene})`);
 };

 document.querySelectorAll('[data-select-lesao]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const idx = Number(el.dataset.selectLesao);
   const row = LESOES_TABLE[idx];
   if (!row) return;
   const modal = document.querySelector('#vigilia-lesao-modal');
   if (modal) modal.style.display = 'none';
   const range = `${row.min}${row.max !== row.min ? `–${row.max}` : ''}`;
   applyLesaoChoice(row, range);
  };
 });

 document.querySelectorAll('[data-select-trauma]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   const idx = Number(el.dataset.selectTrauma);
   const row = TRAUMAS_TABLE[idx];
   if (!row) return;
   const modal = document.querySelector('#vigilia-trauma-modal');
   if (modal) modal.style.display = 'none';
   const range = `${row.min}${row.max !== row.min ? `–${row.max}` : ''}`;
   applyTraumaChoice(row, range);
  };
 });

 document.querySelectorAll('[data-roll-table]').forEach(btn => {
  btn.onclick = async (e) => {
   e.stopPropagation();
   const table = btn.dataset.rollTable;
   if (table === 'lesao') {
    const modal = document.querySelector('#vigilia-lesao-modal');
    if (modal) modal.style.display = 'none';
    const res = await roll('Tabela de Lesões', [20], 0);
    if (res && res.values) {
     const val = res.values[0];
     const outcome = getLesaoResult(val);
     setTimeout(() => {
      applyLesaoChoice(outcome, `1d20: ${val}`);
     }, 700);
    }
   } else if (table === 'trauma') {
    const modal = document.querySelector('#vigilia-trauma-modal');
    if (modal) modal.style.display = 'none';
    const res = await roll('Tabela de Traumas', [20], 0);
    if (res && res.values) {
     const val = res.values[0];
     const outcome = getTraumaResult(val);
     setTimeout(() => {
      applyTraumaChoice(outcome, `1d20: ${val}`);
     }, 700);
    }
   }
  };
 });

 document.querySelectorAll('[data-spend-prontidao]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   if (state.pd >= 2) {
    state.pd -= 2;
    updateResourceUi('pd');
    save(false);
    render();
    const toast = document.querySelector('#save-toast');
    if (toast) {
     toast.textContent = 'PRONTIDÃO ATIVADA (-2 PD)';
     toast.classList.add('show');
     setTimeout(() => { toast.classList.remove('show'); toast.textContent = 'SALVO'; }, 1800);
    }
   } else {
    alert('Pontos de Determinação insuficientes (Necessário 2 PD).');
   }
  };
 });

 // Marcadores de Ímpeto e Análise
 function setVigiliaMarkerSlot(type, targetIdx) {
  const isImpeto = type === 'impeto';
  const card = state.cards?.find(c => isImpeto ? (c.id === 'impeto' || c.title?.toUpperCase().includes('ÍMPETO')) : (c.id === 'analise' || c.title?.toUpperCase().includes('ANÁLISE')));
  if (!card) return;
  if (!Array.isArray(card.markers)) card.markers = [];
  let marker = card.markers.find(m => isImpeto ? (m.id === 'impeto-m' || m.label?.toLowerCase().includes('ímpeto')) : (m.id === 'analise-m' || m.label?.toLowerCase().includes('análise'))) || card.markers[0];
  if (!marker) {
   marker = {
    id: isImpeto ? 'impeto-m' : 'analise-m',
    type: 'pips',
    displayStyle: 'rectangles',
    label: isImpeto ? 'Barra de Ímpeto' : 'Marcadores de Análise',
    current: 0,
    maxFormula: isImpeto ? '5' : '4'
   };
   card.markers.push(marker);
  }
  const cur = Number(marker.current) || 0;
  const next = cur === targetIdx ? targetIdx - 1 : targetIdx;
  marker.current = Math.max(0, next);
  save(false);
  updateMarkerUi(card.id, marker.id);
 }

 document.querySelectorAll('[data-vigilia-slot]').forEach(el => {
  el.onclick = (e) => {
   e.preventDefault();
   e.stopPropagation();
   const [type, idxStr] = el.dataset.vigiliaSlot.split(':');
   setVigiliaMarkerSlot(type, Number(idxStr) || 1);
  };
 });

 // Clique direto no medalhão celta de PV ou PD para ajuste numérico rápido
 document.querySelectorAll('.vigilia-resource-block .resource-badge-group').forEach(badge => {
  badge.style.cursor = 'pointer';
  badge.onclick = (e) => {
   e.stopPropagation();
   const block = badge.closest('.vigilia-resource-block');
   const isPv = block?.classList.contains('resource-pv');
   const key = isPv ? 'pv' : 'pd';
   const maxKey = isPv ? 'maxPv' : 'maxPd';
   const cur = state[key] ?? (isPv ? 20 : 10);
   const max = state[maxKey] ?? cur;
   const input = prompt(`Definir ${key.toUpperCase()} atual (0 a ${max}):`, cur);
   if (input !== null) {
    const val = parseInt(input, 10);
    if (!isNaN(val)) {
     state[key] = Math.max(0, Math.min(max, val));
     save(false);
     updateResourceUi(key);
    }
   }
  };
 });
}

function bindBestiaryLicenseEvents() {
  document.querySelectorAll('[data-open-bestiary-unlock]').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modal = document.querySelector('#bestiary-unlock-modal');
      if (modal) {
        modal.style.display = 'grid';
        const status = modal.querySelector('.dropzone-status');
        if (status) status.style.display = 'none';
      }
    };
  });

  document.querySelectorAll('[data-close-bestiary-modal]').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      const modal = document.querySelector('#bestiary-unlock-modal');
      if (modal) modal.style.display = 'none';
    };
  });

  document.querySelectorAll('[data-open-bestiary-license-modal]').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const modal = document.querySelector('#bestiary-manage-modal');
      if (modal) modal.style.display = 'grid';
    };
  });

  document.querySelectorAll('[data-close-manage-modal]').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      const modal = document.querySelector('#bestiary-manage-modal');
      if (modal) modal.style.display = 'none';
    };
  });

  document.querySelectorAll('[data-revoke-bestiary-license]').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      if (confirm('Deseja bloquear o bestiário oficial novamente? Para desbloquear depois, basta carregar seu PDF da Jambô Editora.')) {
        revokeBestiaryLicense();
        const modal = document.querySelector('#bestiary-manage-modal');
        if (modal) modal.style.display = 'none';
        save(false);
        render();
      }
    };
  });

  async function handlePdfVerification(file, statusContainer) {
    if (!file || !statusContainer) return;
    statusContainer.className = 'dropzone-status loading';
    statusContainer.innerHTML = '<span class="spinner"></span> <span>Carregando leitor seguro de PDF...</span>';
    statusContainer.style.display = 'block';

    try {
      const res = await verifyPdfFile(file, ({ message }) => {
        statusContainer.innerHTML = `<span class="spinner"></span> <span>${safe(message)}</span>`;
      });

      statusContainer.className = 'dropzone-status success';
      statusContainer.innerHTML = `
        <b>✓ Titularidade Validada com Sucesso!</b>
        <span>Licenciado para: <b>${safe(res.license.buyerName)}</b> (${safe(res.license.buyerEmail)})<br>Obra: <b>${safe(res.license.detectedBook)}</b></span>
      `;

      setTimeout(() => {
        const unlockModal = document.querySelector('#bestiary-unlock-modal');
        if (unlockModal) unlockModal.style.display = 'none';
        save(false);
        render();
      }, 1200);
    } catch (err) {
      statusContainer.className = 'dropzone-status error';
      statusContainer.innerHTML = `
        <b>✕ Falha na Verificação do Livro</b>
        <span>${safe(err.message || 'Erro ao processar PDF.').replace(/\\n/g, '<br>')}</span>
      `;
    }
  }

  document.querySelectorAll('[data-bestiary-file-input]').forEach(input => {
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      const prefix = input.dataset.bestiaryFileInput || 'modal';
      const statusContainer = document.querySelector(`[data-dropzone-status="${prefix}"]`) || input.closest('.bestiary-dropzone')?.querySelector('.dropzone-status');
      if (file && statusContainer) {
        handlePdfVerification(file, statusContainer);
      }
    };
  });

  document.querySelectorAll('[data-bestiary-dropzone]').forEach(zone => {
    zone.ondragover = (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('drag-active');
    };
    zone.ondragleave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('drag-active');
    };
    zone.ondrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('drag-active');
      const file = e.dataTransfer?.files?.[0];
      const prefix = zone.dataset.bestiaryDropzone || 'modal';
      const statusContainer = zone.querySelector(`[data-dropzone-status="${prefix}"]`) || zone.querySelector('.dropzone-status');
      if (file && statusContainer) {
        handlePdfVerification(file, statusContainer);
      }
    };
  });
}

function bindWorkspaceSidebarEvents() {
 document.querySelectorAll('[data-toggle-navigator]').forEach(btn => {
  btn.onclick = () => {
   sidebarNavigatorOpen = !sidebarNavigatorOpen;
   appSettings.sidebarNavigatorOpen = sidebarNavigatorOpen;
   saveAppSettings();
   render();
  };
 });

 document.querySelectorAll('[data-close-navigator]').forEach(btn => {
  btn.onclick = () => {
   sidebarNavigatorOpen = false;
   appSettings.sidebarNavigatorOpen = false;
   saveAppSettings();
   render();
  };
 });

 document.querySelectorAll('[data-nav-pin]').forEach(btn => {
  btn.onclick = () => {
   sidebarNavigatorPinned = !sidebarNavigatorPinned;
   appSettings.sidebarNavigatorPinned = sidebarNavigatorPinned;
   saveAppSettings();
   render();
  };
 });

 document.querySelectorAll('[data-sidebar-scope], [data-nav-scope-tab]').forEach(btn => {
  btn.onclick = () => {
   const nextScope = btn.dataset.sidebarScope || btn.dataset.navScopeTab || 'all';
   if (nextScope === sidebarScope) return;
   sidebarScope = nextScope;
   appSettings.sidebarScope = sidebarScope;
   saveAppSettings();
   render();
  };
 });

 document.querySelectorAll('[data-nav-search-input]').forEach(input => {
  input.oninput = (e) => {
   sidebarSearchQuery = e.target.value;
   updateNavigatorTreeOnly();
  };
 });

 document.querySelectorAll('[data-nav-clear-search]').forEach(btn => {
  btn.onclick = () => {
   sidebarSearchQuery = '';
   render();
  };
 });

 document.querySelectorAll('[data-nav-create-folder]').forEach(btn => {
  btn.onclick = () => {
   const name = prompt('Nome da nova pasta:');
   if (name && name.trim()) {
    const res = createFolder(folders, { name: name.trim() });
    folders = res.folders;
    persistFoldersToStorage(folders, { idbSet });
    render();
   }
  };
 });

 document.querySelectorAll('[data-nav-collapse-all]').forEach(btn => {
  btn.onclick = () => {
   folders.forEach(f => f.collapsed = true);
   persistFoldersToStorage(folders, { idbSet });
   updateNavigatorTreeOnly();
  };
 });

 document.querySelectorAll('[data-nav-expand-all]').forEach(btn => {
  btn.onclick = () => {
   folders.forEach(f => f.collapsed = false);
   persistFoldersToStorage(folders, { idbSet });
   updateNavigatorTreeOnly();
  };
 });

 document.querySelectorAll('[data-open-quick-switcher]').forEach(btn => {
  btn.onclick = () => {
   quickSwitcherOpen = true;
   quickSwitcherQuery = '';
   quickSwitcherIndex = 0;
   render();
   setTimeout(() => document.querySelector('[data-qs-input]')?.focus(), 25);
  };
 });

 document.querySelectorAll('[data-mobile-search-input]').forEach(input => {
  input.oninput = (e) => {
   mobileSearchQuery = e.target.value;
   updateMobileDrawerOnly();
  };
 });

 document.querySelectorAll('[data-mobile-clear-search]').forEach(btn => {
  btn.onclick = () => {
   mobileSearchQuery = '';
   render();
  };
 });

 // Eventos do Painel de Filtros de Ameaças
 document.querySelectorAll('[data-toggle-threat-filters-panel]').forEach(el => {
  el.onclick = (e) => {
   e.stopPropagation();
   threatFiltersOpen = !threatFiltersOpen;
   appSettings.threatFiltersOpen = threatFiltersOpen;
   saveAppSettings();
   render();
  };
 });

 document.querySelectorAll('[data-filter-threat-element]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const el = btn.dataset.filterThreatElement;
   if (el) {
    threatFilterElement = el;
    appSettings.threatFilterElement = el;
    saveAppSettings();
    render();
   }
  };
 });

 document.querySelectorAll('[data-filter-threat-vd]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   const vd = btn.dataset.filterThreatVd;
   if (vd) {
    threatFilterVdRange = vd;
    threatFilterVdMin = '';
    threatFilterVdMax = '';
    appSettings.threatFilterVdRange = vd;
    appSettings.threatFilterVdMin = '';
    appSettings.threatFilterVdMax = '';
    saveAppSettings();
    render();
   }
  };
 });

 document.querySelectorAll('[data-threat-vd-min]').forEach(input => {
  input.oninput = (e) => {
   threatFilterVdMin = e.target.value;
   threatFilterVdRange = (threatFilterVdMin || threatFilterVdMax) ? 'custom' : 'all';
   appSettings.threatFilterVdMin = threatFilterVdMin;
   appSettings.threatFilterVdRange = threatFilterVdRange;
   saveAppSettings();
   updateNavigatorTreeOnly();
   updateThreatPanelCountsOnly();
   updateRailSwitcherOnly();
  };
 });

 document.querySelectorAll('[data-threat-vd-max]').forEach(input => {
  input.oninput = (e) => {
   threatFilterVdMax = e.target.value;
   threatFilterVdRange = (threatFilterVdMin || threatFilterVdMax) ? 'custom' : 'all';
   appSettings.threatFilterVdMax = threatFilterVdMax;
   appSettings.threatFilterVdRange = threatFilterVdRange;
   saveAppSettings();
   updateNavigatorTreeOnly();
   updateThreatPanelCountsOnly();
   updateRailSwitcherOnly();
  };
 });

 document.querySelectorAll('[data-clear-custom-vd]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   threatFilterVdMin = '';
   threatFilterVdMax = '';
   threatFilterVdRange = 'all';
   appSettings.threatFilterVdMin = '';
   appSettings.threatFilterVdMax = '';
   appSettings.threatFilterVdRange = 'all';
   saveAppSettings();
   render();
  };
 });

 document.querySelectorAll('[data-threat-group-select]').forEach(sel => {
  sel.onchange = (e) => {
   threatGroupBy = e.target.value;
   appSettings.threatGroupBy = threatGroupBy;
   saveAppSettings();
   render();
  };
 });

 document.querySelectorAll('[data-threat-sort-select]').forEach(sel => {
  sel.onchange = (e) => {
   threatSort = e.target.value;
   appSettings.threatSort = threatSort;
   saveAppSettings();
   render();
  };
 });

 document.querySelectorAll('[data-clear-threat-filters]').forEach(btn => {
  btn.onclick = (e) => {
   e.stopPropagation();
   threatFilterElement = 'all';
   threatFilterVdRange = 'all';
   threatFilterVdMin = '';
   threatFilterVdMax = '';
   threatFilterCategory = 'all';
   appSettings.threatFilterElement = 'all';
   appSettings.threatFilterVdRange = 'all';
   appSettings.threatFilterVdMin = '';
   appSettings.threatFilterVdMax = '';
   appSettings.threatFilterCategory = 'all';
   saveAppSettings();
   render();
  };
 });

 bindNavigatorTreeEvents(document);
 bindQuickSwitcherEvents();
}

function cloneSheet(sheetId) {
 const target = sheets.find(s => s.id === sheetId);
 if (!target) return;
 save(false);
 const cloned = clone(target);
 cloned.id = makeId('sheet');
 cloned.name = `${target.name || 'AGENTE'} (Cópia)`;

 if (Array.isArray(cloned.cards)) {
  cloned.cards = cloned.cards.map(card => {
   const c = clone(card);
   c.id = makeId('card');
   const markerIdMap = new Map();
   if (Array.isArray(c.markers)) {
    c.markers.forEach(m => {
     const oldId = m.id;
     m.id = makeId('marker');
     if (oldId) markerIdMap.set(oldId, m.id);
    });
   }
   if (Array.isArray(c.actions)) {
    c.actions.forEach(a => {
     a.id = makeId('action');
     if (a.targetMarker && markerIdMap.has(a.targetMarker)) {
      a.targetMarker = markerIdMap.get(a.targetMarker);
     }
    });
   }
   return c;
  });
 }

 const targetIndex = sheets.findIndex(s => s.id === sheetId);
 if (targetIndex >= 0) {
  sheets.splice(targetIndex + 1, 0, cloned);
 } else {
  sheets.push(cloned);
 }

 const doSwitch = () => {
  state = cloned;
  activeSheetId = cloned.id;
  render();
 };

 if (state.viewMode === 'cinematic' || state.systemMode === 'threat') {
  triggerGlitchTransition(doSwitch);
 } else {
  doSwitch();
 }

 save(true, `FICHA CLONADA: ${cloned.name.toUpperCase()}`);
}

function deleteSheet(sheetId) {
 if (sheets.length <= 1) {
  const toast = document.querySelector('#save-toast');
  if (toast) {
   toast.textContent = 'NÃO É POSSÍVEL EXCLUIR A ÚNICA FICHA';
   toast.classList.add('show');
   setTimeout(() => toast.classList.remove('show'), 1500);
  }
  return;
 }
 const target = sheets.find(s => s.id === sheetId);
 const name = target?.name || 'esta ficha';
 if (!confirm(`Deseja realmente excluir a ficha "${name}"?`)) return;

 const wasActive = (state.id === sheetId);
 sheets = sheets.filter(s => s.id !== sheetId);
 if (wasActive) {
  state = sheets[0];
  activeSheetId = state.id;
 }
 render();
 save(true, 'FICHA EXCLUÍDA');
}

let draggedSheetId = null;
let isDraggingSheet = false;

function bindSheetInteractions() {
 const avatars = document.querySelectorAll('.sheet-avatar');
 avatars.forEach(avatar => {
  avatar.oncontextmenu = (e) => showSheetContextMenu(e, avatar.dataset.sheetId);

  avatar.ondragstart = (e) => {
   draggedSheetId = avatar.dataset.sheetId;
   isDraggingSheet = true;
   try {
    e.dataTransfer.setData('text/sheet-id', avatar.dataset.sheetId);
    e.dataTransfer.setData('text/plain', avatar.dataset.sheetId);
   } catch {}
   e.dataTransfer.effectAllowed = 'move';
   avatar.classList.add('dragging');
  };

  avatar.ondragend = () => {
   avatar.classList.remove('dragging');
   avatars.forEach(a => a.classList.remove('drag-over-top', 'drag-over-bottom'));
   setTimeout(() => {
    isDraggingSheet = false;
    draggedSheetId = null;
   }, 100);
  };

  avatar.ondragover = (e) => {
   e.preventDefault();
   e.dataTransfer.dropEffect = 'move';
   const rect = avatar.getBoundingClientRect();
   const isTop = e.clientY < (rect.top + rect.height / 2);
   avatar.classList.toggle('drag-over-top', isTop);
   avatar.classList.toggle('drag-over-bottom', !isTop);
  };

  avatar.ondragleave = () => {
   avatar.classList.remove('drag-over-top', 'drag-over-bottom');
  };

  avatar.ondrop = (e) => {
   e.preventDefault();
   e.stopPropagation();
   avatar.classList.remove('drag-over-top', 'drag-over-bottom');
   const fromId = draggedSheetId || e.dataTransfer.getData('text/sheet-id') || e.dataTransfer.getData('text/plain');
   const toId = avatar.dataset.sheetId;
   if (!fromId || !toId || fromId === toId) return;

   const fromIndex = sheets.findIndex(s => s.id === fromId);
   const toIndex = sheets.findIndex(s => s.id === toId);
   if (fromIndex < 0 || toIndex < 0) return;

   const rect = avatar.getBoundingClientRect();
   const isTop = e.clientY < (rect.top + rect.height / 2);

   const [moved] = sheets.splice(fromIndex, 1);
   let targetIndex = sheets.findIndex(s => s.id === toId);
   if (!isTop) targetIndex += 1;
   sheets.splice(targetIndex, 0, moved);
   if (presentationMode) {
    presentationIndex = Math.max(0, getPresentationSheets().findIndex(s => s.id === state.id));
   }
   save(true, 'FICHAS REORGANIZADAS');
   render();
  };
 });

 const switcher = document.querySelector('.sheet-switcher');
 if (switcher) {
  switcher.ondragover = (e) => {
   if (!draggedSheetId) return;
   e.preventDefault();
   e.dataTransfer.dropEffect = 'move';
  };
  switcher.ondrop = (e) => {
   if (!draggedSheetId) return;
   if (e.target.closest('.sheet-avatar')) return;
   e.preventDefault();
   const fromIndex = sheets.findIndex(s => s.id === draggedSheetId);
   if (fromIndex < 0) return;
   const [moved] = sheets.splice(fromIndex, 1);
   sheets.push(moved);
   if (presentationMode) {
    presentationIndex = Math.max(0, getPresentationSheets().findIndex(s => s.id === state.id));
   }
   save(true, 'FICHAS REORGANIZADAS');
   render();
  };
 }
}
function parseRollExpression(expression){const vars=formulaVariables();let expanded=String(expression||'').replace(/@\{([^}]+)\}/g,(_,key)=>String(vars[formulaKey(key)]??0));const dice=[];expanded=expanded.replace(/(\d*)d(4|6|8|10|12|20)/gi,(_,count,sides)=>{for(let i=0;i<Math.min(12,Number(count)||1);i++)dice.push(Number(sides));return '0'});let modifier=0;try{if(/^[\d+\-*/().\s]+$/.test(expanded))modifier=Math.floor(Function(`"use strict";return (${expanded||0})`)())}catch{}return{dice,modifier}}
async function roll(name,sides,modifier=0,rollMode='sum'){
 const list=Array.isArray(sides)?sides:String(sides).split(',').map(Number).filter(side=>DICE_STEPS.includes(side));
 if(!list.length)return null;
 const soundContext=getUiAudioContext(),{rollDice3d}=await getDiceApi(),color=state.diceColor||getSheetAccent(state);
 let dreadIndex = -1;
 const diceConfigs = list.map(side => ({ sides: side, color }));
 if (state.viewMode === 'vigilia' && state.dadoPavor && !name.includes('Pavor') && !name.includes('Tabela') && !name.includes('Lesão') && !name.includes('Trauma') && !name.includes('Falha') && list.length >= 2) {
  if (state.pavorEmbraced) {
   diceConfigs.push({ sides: state.dadoPavor, color: '#f43f5e', label: `Bônus Pavor (d${state.dadoPavor})` });
   state.pavorEmbraced = false;
   save(false);
  } else {
   dreadIndex = diceConfigs.length;
   diceConfigs.push({ sides: state.dadoPavor, color: '#7c3aed', label: `Pavor (d${state.dadoPavor})`, dread: true });
  }
 }
 const res=await rollDice3d(diceConfigs,name,Number(modifier)||0,soundContext,rollMode);
 if(res&&Array.isArray(res.values)){
  if (dreadIndex >= 0 && res.values[dreadIndex] !== undefined) {
   if (res.vanquished) {
    state.dadoPavor = null;
    save(false);
    const toast = document.querySelector('#save-toast');
    if (toast) {
     toast.textContent = 'DADO DE PAVOR TIROU 1: VENCEU O PAVOR!';
     toast.classList.add('show');
     setTimeout(() => toast.classList.remove('show'), 2500);
    }
    // Re-renderiza só depois que o palco de dados fechar, para não cortar a animação.
    setTimeout(() => render(), 4300);
   }
  }
  addRollLogEntry({title:name,dice:res.breakdown||res.values.map((v,i)=>({sides:diceConfigs[i]?.sides||20,value:v})),modifier:Number(modifier)||0,total:res.total,rollMode});
 }
 return res;
}

async function rollExpression(name,expression){const parsed=parseRollExpression(expression);return roll(name,parsed.dice,parsed.modifier,'sum')}

async function rollOriginalAttribute(attrKey){
 if(presentationMode)return;
 const attrInfo=ORIGINAL_ATRIBUTOS.find(a=>a.id===attrKey)||{nome:attrKey.toUpperCase(),abrev:attrKey.toUpperCase()};
 const attrVal=Number(state.atributos?.[attrKey]??1);
 const count=attrVal>0?attrVal:2;
 const rollMode=attrVal>0?'highest':'lowest';
 const sides=Array(count).fill(20);
 const title=`Teste de ${attrInfo.nome} (${attrVal>0?`${attrVal}d20`: '2d20 Menor'})`;
 return roll(title,sides,0,rollMode);
}

async function rollOriginalSkill(periciaId){
 if(presentationMode)return;
 const pericia=ORIGINAL_PERICIAS.find(p=>p.id===periciaId)||{nome:periciaId,atributo:'pre'};
 const st=state.pericias?.[periciaId]||{treino:0,extra:0};
 const attrEfetivo=atributoEfetivoDaPericia(state,pericia);
 const attrVal=Number(state.atributos?.[attrEfetivo]??1);
 const count=attrVal>0?attrVal:2;
 const rollMode=attrVal>0?'highest':'lowest';
 const sides=Array(count).fill(20);
 const bonusPoder=originalBonusPoderesPorPericia(state)[periciaId]||0;
 const totalMod=Number(st.treino||0)+Number(st.extra||0)+bonusPoder;
 const title=`Teste de ${pericia.nome} (${attrVal>0?`${attrVal}d20`: '2d20 Menor'})`;
 return roll(title,sides,totalMod,rollMode);
}

async function rollOriginalAttack(atkIdx){
 if(presentationMode)return;
 const atk=state.ataques?.[atkIdx];
 if(!atk)return;
 const atkName=atk.nome||'Ataque';
 const expr=(atk.ataque||'').trim();
 const matchedSkill=ORIGINAL_PERICIAS.find(p=>p.nome.toLowerCase()===expr.toLowerCase()||p.id===expr.toLowerCase());
 if(matchedSkill){
  return rollOriginalSkill(matchedSkill.id);
 }
 const parsed=parseRollExpression(expr);
 if(parsed.dice.length){
  const allD20=parsed.dice.every(d=>d===20);
  const rollMode=allD20&&parsed.dice.length>1?'highest':'sum';
  return roll(`${atkName} (Ataque)`,parsed.dice,parsed.modifier,rollMode);
 }
 const defaultSkill=ORIGINAL_PERICIAS.find(p=>p.id==='pontaria')||ORIGINAL_PERICIAS[0];
 return rollOriginalSkill(defaultSkill.id);
}

async function rollOriginalDamage(atkIdx){
 if(presentationMode)return;
 const atk=state.ataques?.[atkIdx];
 if(!atk)return;
 const atkName=atk.nome||'Ataque';
 const expr=(atk.dano||'1d8').trim();
 const parsed=parseRollExpression(expr);
 if(!parsed.dice.length){
  parsed.dice=[8];
 }
 return roll(`${atkName} (Dano)`,parsed.dice,parsed.modifier,'sum');
}

async function castRitual(ritualId){
 if(presentationMode)return;
 const ritual=ORIGINAL_RITUAIS.find(r=>r.id===ritualId);
 if(!ritual)return;
 const cost=Number(ritual.custoPE)||1;
 const currentPe=Number(state.pe)||0;
 if(currentPe<cost){
  const toast=document.querySelector('#save-toast');
  if(toast){
   toast.textContent=`PE INSUFICIENTE (NECESSÁRIO ${cost} PE)!`;
   toast.classList.add('show');
   setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},1800);
  }
  return;
 }
 state.pe=Math.max(0,currentPe-cost);
 playResourceSound(false);
 save(false);
 render();
 const toast=document.querySelector('#save-toast');
 if(toast){
  toast.textContent=`RITUAL ${ritual.nome.toUpperCase()} CONJURADO! (-${cost} PE)`;
  toast.classList.add('show');
  setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},2200);
 }
}
function setSelectVisual(id,value){const select=document.querySelector(`[data-select-id="${id}"]`);if(!select)return;const option=[...select.querySelectorAll('.select-option')].find(item=>String(item.dataset.selectValue)===String(value));select.querySelector('.select-display').textContent=option?.dataset.triggerLabel||value;select.querySelectorAll('.select-option').forEach(item=>{item.classList.toggle('selected',item===option);item.querySelector('b').textContent=item===option?'✓':''});if(select.dataset.formName)select.previousElementSibling.value=value}
function renderCardBuilders(){const markerBuilder=document.querySelector('#marker-builder'),actionBuilder=document.querySelector('#action-builder');if(!markerBuilder||!actionBuilder)return;markerBuilder.innerHTML=editorMarkers.map((marker,index)=>`<article class="builder-row"><div class="builder-row-head"><b>MARCADOR ${index+1}</b><button type="button" data-remove-marker="${index}">${icon('trash',15)}</button></div><div class="marker-types">${[['counter','CONTADOR'],['bar','BARRA'],['pips','CARGAS'],['slots','SLOTS'],['toggle','LIGA/DESLIGA']].map(([type,label])=>`<button type="button" class="${marker.type===type?'active':''}" data-marker-type="${index}:${type}">${label}</button>`).join('')}</div>${marker.type==='pips'||marker.type==='bar'||marker.type==='slots'?`<div class="marker-display-styles"><span>ESTILO VISUAL</span><button type="button" class="${(marker.displayStyle||'default')==='default'?'active':''}" data-marker-style="${index}:default">ATUAL</button><button type="button" class="${marker.displayStyle==='rectangles'?'active':''}" data-marker-style="${index}:rectangles">RETANGULAR</button></div>`:''}<div class="builder-fields"><label>LABEL<input data-marker-field="${index}:label" value="${safe(marker.label)}"></label><label>ATUAL<input type="number" min="0" data-marker-field="${index}:current" value="${Number(marker.current)||0}"></label>${marker.type!=='toggle'?`<label>MÁXIMO / FÓRMULA<input data-marker-field="${index}:maxFormula" value="${safe(marker.maxFormula||'0')}" placeholder="@{level} + 2"></label>`:''}${marker.type==='slots'?`<label>RECURSO PREENCHER<select data-marker-field="${index}:fillCostResource"><option value="none" ${(!marker.fillCostResource||marker.fillCostResource==='none')?'selected':''}>Nenhum</option><option value="pd" ${marker.fillCostResource==='pd'?'selected':''}>PD</option><option value="pv" ${marker.fillCostResource==='pv'?'selected':''}>PV</option></select></label><label>CUSTO RECURSO<input type="number" min="0" data-marker-field="${index}:fillCostAmount" value="${Number(marker.fillCostAmount)||0}"></label>`:''}</div></article>`).join('')||'<p class="builder-empty">Nenhum marcador neste card.</p>';actionBuilder.innerHTML=editorActions.map((action,index)=>{const slotsMarkers=editorMarkers.filter(m=>m.type==='slots');return `<article class="builder-row action-row"><div class="builder-fields"><label>NOME<input data-action-field="${index}:name" value="${safe(action.name)}" placeholder="Ataque"></label><label>EXPRESSÃO<input data-action-field="${index}:expression" value="${safe(action.expression)}" placeholder="3d6"></label>${slotsMarkers.length?`<label>PREENCHER MARCADOR<select data-action-field="${index}:targetMarker"><option value="">Nenhum</option>${slotsMarkers.map((m,i)=>`<option value="${safe(m.id||`marker-${i}`)}" ${action.targetMarker===(m.id||`marker-${i}`)?'selected':''}>${safe(m.label||`Slots ${i+1}`)}</option>`).join('')}</select></label>`:''}<button type="button" data-remove-action="${index}">${icon('trash',16)}</button></div></article>`}).join('')||'<p class="builder-empty">Nenhuma ação de rolagem neste card.</p>';bindBuilderEvents()}
function bindBuilderEvents(){document.querySelectorAll('[data-marker-type]').forEach(el=>el.onclick=()=>{const[index,type]=el.dataset.markerType.split(':');editorMarkers[index].type=type;if(type==='slots'&&!editorMarkers[index].fillCostResource)editorMarkers[index].fillCostResource='pd';renderCardBuilders()});document.querySelectorAll('[data-marker-style]').forEach(el=>el.onclick=()=>{const[index,displayStyle]=el.dataset.markerStyle.split(':');editorMarkers[index].displayStyle=displayStyle;renderCardBuilders()});document.querySelectorAll('[data-remove-marker]').forEach(el=>el.onclick=()=>{editorMarkers.splice(Number(el.dataset.removeMarker),1);renderCardBuilders()});document.querySelectorAll('[data-remove-action]').forEach(el=>el.onclick=()=>{editorActions.splice(Number(el.dataset.removeAction),1);renderCardBuilders()});document.querySelectorAll('[data-marker-field]').forEach(el=>{const handler=()=>{const[index,key]=el.dataset.markerField.split(':');editorMarkers[index][key]=['current','fillCostAmount'].includes(key)?Number(el.value)||0:el.value};el.oninput=handler;el.onchange=handler});document.querySelectorAll('[data-action-field]').forEach(el=>{const handler=()=>{const[index,key]=el.dataset.actionField.split(':');editorActions[index][key]=el.value};el.oninput=handler;el.onchange=handler})}
function openCardEditor(cardId=null){const modal=document.querySelector('#card-editor'),form=document.querySelector('#card-form'),card=state.cards.find(item=>item.id===cardId);form.reset();form.dataset.cardId=cardId||'';document.querySelector('#editor-title').textContent=card?'EDITAR CARD':`NOVO ${currentRight==='items'?'ITEM':'RECURSO'}`;setSelectVisual('editor-schema',card?.schema||currentRight);setSelectVisual('editor-layout',card?.layout||'standard');setSelectVisual('editor-collapsed',String(card?.collapsed||false));setSelectVisual('editor-color-mode',card?.themeLinked===false?'custom':'profile');form.elements.title.value=card?.title||'';form.elements.type.value=card?.type||(currentRight==='items'?'Equipamento':'Habilidade');form.elements.cost.value=card?(card.cost!==undefined?card.cost:getCardCost(card)):'';form.elements.icon.value=card?.icon||'◆';form.elements.accent.value=card?.accent||PROFILE_COLORS[state.profile]||'#e91d25';form.elements.imageUrl.value=card?.imageUrl||'';form.elements.content.value=card?.content||'';editorMarkers=clone(card?.markers||[]);editorActions=clone(card?.actions||[]);form.querySelector('.delete-card').hidden=!card;renderCardBuilders();modal.classList.remove('closing');modal.classList.add('open')}
function closeCardEditor(){const modal=document.querySelector('#card-editor');if(!modal)return;modal.classList.add('closing');setTimeout(()=>modal.classList.remove('open','closing'),160)}
function openSkillInfo(index){if(!state.skills||!state.skills[index])return;const skill=state.skills[index],modal=document.querySelector('#skill-info-modal'),upper=String(skill.name).toUpperCase(),info=SKILL_INFO[upper]||(upper.startsWith('APTIDÃO')?SKILL_INFO['APTIDÃO (HUMANAS)']:null)||SKILL_INFO['APTIDÃO']||['Use esta perícia em testes relacionados à sua especialidade.',skill.attribute];document.querySelector('#skill-info-title').textContent=skill.name;document.querySelector('#skill-info-copy').textContent=info[0];document.querySelector('#skill-info-attribute').textContent=`ATRIBUTO SUGERIDO · ${info[1]||skill.attribute}`;modal.classList.add('open')}
function closeSkillInfo(){document.querySelector('#skill-info-modal')?.classList.remove('open')}
let activeSlotTarget=null;
function openSlotModal(card,marker,slotIndex=0){const modal=document.querySelector('#slot-fill-modal');if(!modal)return;activeSlotTarget={card,marker,slotIndex};const costRes=(marker.fillCostResource||'pd').toLowerCase(),costAmt=Number(marker.fillCostAmount)||0,currentVal=state[costRes]??0;document.querySelector('#slot-fill-title').textContent=`ESPAÇO ${slotIndex+1} · ${marker.label||'SLOT'}`;document.querySelector('#slot-fill-info').innerHTML=costAmt>0?`Custo: <strong>${costAmt} ${costRes.toUpperCase()}</strong> (Você possui ${currentVal} ${costRes.toUpperCase()} disponíveis).`:`Preencha este espaço com o valor desejado.`;document.querySelector('#slot-manual-val').value='';modal.classList.add('open')}
function closeSlotModal(){document.querySelector('#slot-fill-modal')?.classList.remove('open');activeSlotTarget=null}
function triggerResourceShake(key){if(!key)return;playGlitchSound();const targets=document.querySelectorAll(`[data-resource-key="${key.toLowerCase()}"]`);targets.forEach(target=>{target.classList.remove('resource-glitch-shake');void target.offsetWidth;target.classList.add('resource-glitch-shake');target.addEventListener('animationend',()=>target.classList.remove('resource-glitch-shake'),{once:true});setTimeout(()=>target.classList.remove('resource-glitch-shake'),420)})}
function applySlotValue(value){if(!activeSlotTarget||value===null||value===undefined||value==='')return;const{card,marker,slotIndex}=activeSlotTarget,costRes=(marker.fillCostResource||'pd').toLowerCase(),costAmt=Number(marker.fillCostAmount)||0;let spentResource=null;if(costAmt>0){const currentVal=state[costRes]??0;if(currentVal<costAmt){const toast=document.querySelector('#save-toast');if(toast){toast.textContent=`${costRes.toUpperCase()} INSUFICIENTE (NECESSÁRIO ${costAmt})`;toast.classList.add('show');setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},1800)}return}state[costRes]-=costAmt;spentResource=costRes;playResourceSound(false)}if(!Array.isArray(marker.slots))marker.slots=[];marker.slots[slotIndex]=Number(value)||value;marker.current=marker.slots.filter(v=>v!==null&&v!==undefined&&v!=='').length;closeSlotModal();save(false);render();if(spentResource)triggerResourceShake(spentResource);const toast=document.querySelector('#save-toast');if(toast){toast.textContent=costAmt>0?`-${costAmt} ${costRes.toUpperCase()} · ESPAÇO ${slotIndex+1} PREENCHIDO COM [ ${value} ]!`:`ESPAÇO ${slotIndex+1} PREENCHIDO COM [ ${value} ]!`;toast.classList.add('show');setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},1800)}}
async function upscaleAndEnhanceImage(source,options={}){if(!source)return null;const{scale=2,sharpness=1.0,denoiseAlpha=true}=options;return new Promise((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>{try{const origW=img.naturalWidth||img.width,origH=img.naturalHeight||img.height;const actualScale=Math.min(scale,2560/Math.max(origW,origH));const targetW=Math.max(1,Math.round(origW*actualScale)),targetH=Math.max(1,Math.round(origH*actualScale));const canvas=document.createElement('canvas');canvas.width=targetW;canvas.height=targetH;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,targetW,targetH);const imgData=ctx.getImageData(0,0,targetW,targetH),data=imgData.data;const w=targetW,h=targetH,total=w*h;const Y=new Float32Array(total),outY=new Float32Array(total),Cb=new Float32Array(total),Cr=new Float32Array(total);for(let i=0;i<total;i++){const idx=i*4,r=data[idx],g=data[idx+1],b=data[idx+2];Y[i]=0.299*r+0.587*g+0.114*b;Cb[i]=-0.1687*r-0.3313*g+0.5*b+128.0;Cr[i]=0.5*r-0.4187*g-0.0813*b+128.0}const strength=Math.max(0.4,Math.min(2.0,sharpness));const cFactor=1.0+1.2*strength,crossFactor=0.2*strength,diagFactor=0.1*strength;for(let y=1;y<h-1;y++){const row=y*w,rowUp=(y-1)*w,rowDown=(y+1)*w;for(let x=1;x<w-1;x++){const idx=row+x;const c=Y[idx],u=Y[rowUp+x],d=Y[rowDown+x],l=Y[idx-1],r=Y[idx+1];const ul=Y[rowUp+x-1],ur=Y[rowUp+x+1],dl=Y[rowDown+x-1],dr=Y[rowDown+x+1];let min=c<u?c:u;if(d<min)min=d;if(l<min)min=l;if(r<min)min=r;if(ul<min)min=ul;if(ur<min)min=ur;if(dl<min)min=dl;if(dr<min)min=dr;let max=c>u?c:u;if(d>max)max=d;if(l>max)max=l;if(r>max)max=r;if(ul>max)max=ul;if(ur>max)max=ur;if(dl>max)max=dl;if(dr>max)max=dr;const cross=u+d+l+r,diag=ul+ur+dl+dr;const sharp=c*cFactor-crossFactor*cross-diagFactor*diag;outY[idx]=sharp<min?min:(sharp>max?max:sharp)}}for(let i=0;i<total;i++){const idx=i*4,a=data[idx+3];if(denoiseAlpha&&a<14){data[idx]=0;data[idx+1]=0;data[idx+2]=0;data[idx+3]=0;continue}const yVal=outY[i]||Y[i],cbVal=Cb[i]-128.0,crVal=Cr[i]-128.0;const r=yVal+1.402*crVal,g=yVal-0.34414*cbVal-0.71414*crVal,b=yVal+1.772*cbVal;data[idx]=r<0?0:(r>255?255:Math.round(r));data[idx+1]=g<0?0:(g>255?255:Math.round(g));data[idx+2]=b<0?0:(b>255?255:Math.round(b))}ctx.putImageData(imgData,0,0);resolve(canvas.toDataURL('image/webp',0.96))}catch(err){reject(err)}};img.onerror=reject;img.src=source})}
function readImage(file,key,maxDimension=2048){if(!file||!file.type.startsWith('image/'))return;const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{const maxDim=maxDimension||2048,scale=Math.min(1,maxDim/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,0,0,canvas.width,canvas.height);state[key]=canvas.toDataURL('image/webp',.96);save(false);render()};image.src=reader.result};reader.readAsDataURL(file)}
let uiAudioContext;
function getUiAudioContext(){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return null;uiAudioContext??=new Context();uiAudioContext.resume?.();return uiAudioContext}
function playResourceSound(increased){const context=getUiAudioContext();if(!context)return;const now=context.currentTime,oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='triangle';oscillator.frequency.setValueAtTime(increased?390:310,now);oscillator.frequency.exponentialRampToValueAtTime(increased?610:190,now+.09);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.055,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+.12);oscillator.connect(gain).connect(context.destination);oscillator.start(now);oscillator.stop(now+.13)}
function playGlitchSound(){const ctx=getUiAudioContext();if(!ctx)return;try{const now=ctx.currentTime,buf=getGlitchNoiseBuffer(ctx);const src=ctx.createBufferSource(),bpf=ctx.createBiquadFilter(),dist=ctx.createWaveShaper(),gain=ctx.createGain();bpf.type='bandpass';bpf.frequency.setValueAtTime(1800,now);bpf.frequency.exponentialRampToValueAtTime(600,now+.12);bpf.Q.setValueAtTime(0.6,now);dist.curve=getGlitchDistCurve();gain.gain.setValueAtTime(0.0001,now);gain.gain.linearRampToValueAtTime(0.38,now+.008);gain.gain.exponentialRampToValueAtTime(0.22,now+.05);gain.gain.exponentialRampToValueAtTime(0.001,now+.42);src.buffer=buf;src.connect(bpf).connect(dist).connect(gain).connect(ctx.destination);src.start(now)}catch(e){}}

let criticalHeartbeatTimer=0,criticalHeartbeatActive=false,criticalHeartbeatIntensity=0,criticalPdAudio=null;
let criticalTendrilRaf=0,criticalTendrilCanvas=null,criticalTendrilIntensity=0,criticalTendrilTargetIntensity=0,criticalTendrils=[],criticalTendrilStopTimer=0;
const reducedMotionQuery=window.matchMedia?.('(prefers-reduced-motion: reduce)');

function emitCriticalHeartbeat(){
 if(!criticalHeartbeatActive)return;
 const atmosphere=document.querySelector('[data-critical-atmosphere]');
 atmosphere?.classList.remove('heartbeat-beat');document.body.classList.remove('critical-heartbeat-beat');
 if(atmosphere){void atmosphere.offsetWidth;atmosphere.classList.add('heartbeat-beat');document.body.classList.add('critical-heartbeat-beat');setTimeout(()=>{atmosphere.classList.remove('heartbeat-beat');document.body.classList.remove('critical-heartbeat-beat')},390)}
 const context=uiAudioContext;if(!context||context.state!=='running')return;
 const now=context.currentTime,intensity=criticalHeartbeatIntensity;
 [.01,.16].forEach((delay,index)=>{
  const oscillator=context.createOscillator(),filter=context.createBiquadFilter(),gain=context.createGain(),start=now+delay;
  oscillator.type='sine';oscillator.frequency.setValueAtTime(index?58:67,start);oscillator.frequency.exponentialRampToValueAtTime(index?38:43,start+.14);
  filter.type='lowpass';filter.frequency.value=118;filter.Q.value=.75;
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime((index?.026:.04)+intensity*.018,start+.018);gain.gain.exponentialRampToValueAtTime(.0001,start+.24);
  oscillator.connect(filter).connect(gain).connect(context.destination);oscillator.start(start);oscillator.stop(start+.26);
 });
}
function scheduleCriticalHeartbeat(immediate=false){
 clearTimeout(criticalHeartbeatTimer);
 if(!criticalHeartbeatActive)return;
 if(immediate)emitCriticalHeartbeat();
 const delay=1180-criticalHeartbeatIntensity*330;
 criticalHeartbeatTimer=setTimeout(()=>scheduleCriticalHeartbeat(true),delay);
}
function setCriticalHeartbeat(active,intensity){
 criticalHeartbeatIntensity=Math.max(0,Math.min(1,intensity||0));
 if(!active){criticalHeartbeatActive=false;clearTimeout(criticalHeartbeatTimer);document.querySelector('[data-critical-atmosphere]')?.classList.remove('heartbeat-beat');document.body.classList.remove('critical-heartbeat-beat');return}
 if(!criticalHeartbeatActive){criticalHeartbeatActive=true;scheduleCriticalHeartbeat(true)}
}
function stopCriticalPdAudio(){
 if(!criticalPdAudio)return;
 const audio=criticalPdAudio;criticalPdAudio=null;
 try{const now=audio.context.currentTime;audio.master.gain.cancelScheduledValues(now);audio.master.gain.setValueAtTime(Math.max(.0001,audio.master.gain.value),now);audio.master.gain.exponentialRampToValueAtTime(.0001,now+.28);setTimeout(()=>audio.sources.forEach(source=>{try{source.stop()}catch{}}),320)}catch{}
}
function setCriticalPdAudio(active,intensity){
 const context=uiAudioContext;
 if(!active||!context||context.state!=='running'){stopCriticalPdAudio();return}
 const level=Math.max(0,Math.min(1,intensity||0));
 if(!criticalPdAudio){
  const master=context.createGain(),lowpass=context.createBiquadFilter(),sources=[];
  master.gain.value=.0001;lowpass.type='lowpass';lowpass.frequency.value=1450;lowpass.Q.value=.8;master.connect(lowpass).connect(context.destination);
  [[72,'sine',.72],[75.4,'triangle',.38],[930,'sine',.085]].forEach(([frequency,type,volume])=>{const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=type;oscillator.frequency.value=frequency;gain.gain.value=volume;oscillator.connect(gain).connect(master);oscillator.start();sources.push(oscillator)});
  criticalPdAudio={context,master,sources};
 }
 const now=context.currentTime,target=.0045+level*.0085;
 criticalPdAudio.master.gain.cancelScheduledValues(now);criticalPdAudio.master.gain.setTargetAtTime(target,now,.22);
}

function stopCriticalTendrils(){
 clearTimeout(criticalTendrilStopTimer);criticalTendrilStopTimer=0;
 cancelAnimationFrame(criticalTendrilRaf);criticalTendrilRaf=0;
 if(criticalTendrilCanvas){const context=criticalTendrilCanvas.getContext('2d');context?.clearRect(0,0,criticalTendrilCanvas.width,criticalTendrilCanvas.height)}
 document.querySelector('[data-critical-atmosphere]')?.classList.remove('critical-pd-retracting');
 criticalTendrilCanvas=null;criticalTendrilIntensity=0;criticalTendrilTargetIntensity=0;criticalTendrils=[];
}
function retractCriticalTendrils(){
 if(!criticalTendrilCanvas)return;
 if(reducedMotionQuery?.matches){stopCriticalTendrils();return}
 if(criticalTendrilStopTimer)return;
 criticalTendrilTargetIntensity=0;criticalTendrils.forEach(tendril=>tendril.targetPresence=0);
 document.querySelector('[data-critical-atmosphere]')?.classList.add('critical-pd-retracting');
 criticalTendrilStopTimer=setTimeout(()=>{criticalTendrilStopTimer=0;if(criticalTendrilTargetIntensity<=0)stopCriticalTendrils()},1100);
}
function layoutCriticalTendril(tendril,width,height){const short=Math.min(width,height),depth=tendril.originDepth||30;if(tendril.side===0){tendril.x=-depth;tendril.y=tendril.position*height}else if(tendril.side===1){tendril.x=width+depth;tendril.y=tendril.position*height}else if(tendril.side===2){tendril.x=tendril.position*width;tendril.y=-depth}else{tendril.x=tendril.position*width;tendril.y=height+depth}const baseAngles=[0,Math.PI,Math.PI/2,-Math.PI/2],angle=baseAngles[tendril.side]+tendril.angleOffset;tendril.dx=Math.cos(angle);tendril.dy=Math.sin(angle);tendril.px=-tendril.dy;tendril.py=tendril.dx;tendril.length=short*tendril.lengthRatio;tendril.amplitude=short*tendril.amplitudeRatio;tendril.baseWidth=short*tendril.widthRatio;return tendril}
function createCriticalTendril(width,height,index){
 const counts=[0,0,0,0];criticalTendrils.filter(t=>t.targetPresence>0).forEach(t=>counts[t.side]++);const weights=counts.map(count=>1/Math.pow(count+1,1.65)),total=weights.reduce((sum,value)=>sum+value,0);let pick=Math.random()*total,side=0;for(;side<3;side++){pick-=weights[side];if(pick<=0)break}const position=.025+Math.random()*.95,r1=Math.random(),r2=Math.random(),r3=Math.random(),r4=Math.random(),tendril={side,position,originDepth:22+Math.random()*34,angleOffset:(Math.random()-.5)*1.28,curveBias:(Math.random()-.5)*.31,kinkPhase:Math.random()*Math.PI*2,kinkStrength:.035+Math.random()*.075,lengthRatio:.36+r2*.42,amplitudeRatio:.026+.06*r3,widthRatio:.032+.055*r4,frequency:.95+r2*2.35,phase:r1*Math.PI*2,speed:.00026+r3*.0004,branches:r4>.68?2:(r4>.24?1:0),shade:Math.floor(Math.random()*3),presence:0,targetPresence:1};return layoutCriticalTendril(tendril,width,height)
}
function reconcileCriticalTendrils(width,height,intensity){
 const desired=Math.round(4+Math.max(0,Math.min(1,intensity))*6),active=criticalTendrils.filter(t=>t.targetPresence>0);
 if(active.length<desired){let missing=desired-active.length;while(missing-->0)criticalTendrils.push(createCriticalTendril(width,height,criticalTendrils.length))}
 else if(active.length>desired)active.slice(desired).reverse().forEach(tendril=>tendril.targetPresence=0);
 criticalTendrils.forEach(tendril=>layoutCriticalTendril(tendril,width,height));
}
function makeCriticalTendrils(width,height,intensity){criticalTendrils=[];reconcileCriticalTendrils(width,height,intensity);return criticalTendrils
}
function traceOrganicRibbon(context,points,baseWidth,phase,time){
 const last=points.length-1;if(last<1)return;
 context.beginPath();
 for(let index=0;index<=last;index++){
  const point=points[index],previous=points[Math.max(0,index-1)],next=points[Math.min(last,index+1)],vx=next.x-previous.x,vy=next.y-previous.y,length=Math.hypot(vx,vy)||1,nx=-vy/length,ny=vx/length,progress=index/last,taper=Math.pow(Math.max(0,1-progress),.72),breath=.9+.1*Math.sin(time*.001+phase+progress*4.7),notch=index%4===0?.84:(index%3===0?1.1:1),width=Math.max(.45,baseWidth*taper*breath*notch);
  const px=point.x+nx*width,py=point.y+ny*width;
  if(index===0)context.moveTo(px,py);else context.lineTo(px,py);
 }
 for(let index=last;index>=0;index--){
  const point=points[index],previous=points[Math.max(0,index-1)],next=points[Math.min(last,index+1)],vx=next.x-previous.x,vy=next.y-previous.y,length=Math.hypot(vx,vy)||1,nx=-vy/length,ny=vx/length,progress=index/last,taper=Math.pow(Math.max(0,1-progress),.72),breath=.9+.1*Math.sin(time*.001+phase+progress*4.7),notch=index%4===0?.84:(index%3===0?1.1:1),width=Math.max(.45,baseWidth*taper*breath*notch);
  context.lineTo(point.x-nx*width,point.y-ny*width);
 }
 context.closePath();
}
function drawCriticalTendrils(canvas,time=0){
 const context=canvas.getContext('2d'),width=canvas.clientWidth,height=canvas.clientHeight,dpr=1;if(!context||!width||!height)return;
 if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);context.setTransform(dpr,0,0,dpr,0,0);if(criticalTendrilStopTimer)criticalTendrils.forEach(tendril=>layoutCriticalTendril(tendril,width,height));else reconcileCriticalTendrils(width,height,criticalTendrilTargetIntensity)}else context.setTransform(dpr,0,0,dpr,0,0);
 context.clearRect(0,0,width,height);context.globalCompositeOperation='source-over';
 criticalTendrils.forEach(tendril=>{
  const presenceEase=tendril.targetPresence>0?.075:.11;tendril.presence+=(tendril.targetPresence-tendril.presence)*presenceEase;if(Math.abs(tendril.targetPresence-tendril.presence)<.002)tendril.presence=tendril.targetPresence;const reveal=tendril.presence;if(reveal<=.002)return;context.save();context.globalAlpha=Math.pow(reveal,1.1)*.68;
  const points=[],growth=.04+reveal*.96+.055*Math.sin(time*.00031+tendril.phase)*reveal,renderLength=tendril.length,renderWidth=tendril.baseWidth*(.18+reveal*.82);
  for(let step=0;step<=14;step++){const progress=step/14,taper=Math.sin(progress*Math.PI),wave=Math.sin(progress*tendril.frequency*Math.PI+tendril.phase+time*tendril.speed)*tendril.amplitude*taper,slowSway=Math.sin(time*tendril.speed*.43+tendril.phase*.7)*tendril.amplitude*.42*progress,tipCurl=Math.sin(progress*Math.PI*.76+tendril.phase*.4-time*tendril.speed*.22)*tendril.amplitude*.5*progress*progress,curve=tendril.curveBias*renderLength*Math.pow(progress,1.45),kink=Math.sin(progress*Math.PI*3+tendril.kinkPhase)*renderLength*tendril.kinkStrength*taper,forwardKink=Math.cos(progress*Math.PI*2.4+tendril.kinkPhase)*tendril.amplitude*.22*taper,lateral=(wave+slowSway+tipCurl)*reveal+curve+kink;points.push({x:tendril.x+tendril.dx*(renderLength*growth*progress+forwardKink)+tendril.px*lateral,y:tendril.y+tendril.dy*(renderLength*growth*progress+forwardKink)+tendril.py*lateral})}
  const tip=points.at(-1),body=context.createLinearGradient(tendril.x,tendril.y,tip.x,tip.y),palette=tendril.shade===0?['#030106','#1a071f','#2a0b31']:tendril.shade===1?['#050108','#26082d','#16031c']:['#08010b','#310a35','#200625'];body.addColorStop(0,palette[0]);body.addColorStop(.64,palette[1]);body.addColorStop(1,palette[2]);
  traceOrganicRibbon(context,points,renderWidth,tendril.phase,time);context.fillStyle=body;context.fill();context.strokeStyle='rgba(82,22,96,.42)';context.lineJoin='miter';context.lineWidth=1+criticalTendrilIntensity*.6;context.stroke();
  context.globalAlpha*=.35;context.strokeStyle='rgba(130,55,145,.38)';context.lineWidth=Math.max(.8,renderWidth*.045);context.lineCap='square';context.beginPath();context.moveTo(points[1].x,points[1].y);for(let index=2;index<points.length;index++)context.lineTo(points[index].x,points[index].y);context.stroke();
  for(let branch=0;branch<tendril.branches;branch++){const branchReveal=Math.max(0,Math.min(1,reveal*1.35-branch*.28));if(branchReveal<=.02)continue;const at=8+branch*5,origin=points[Math.min(at,points.length-4)],next=points[Math.min(at+2,points.length-2)],vx=next.x-origin.x,vy=next.y-origin.y,vlen=Math.hypot(vx,vy)||1,direction=branch%2?1:-1,nx=-vy/vlen*direction,ny=vx/vlen*direction,branchLength=renderLength*(.16+branch*.055)*branchReveal,branchPoints=[];for(let step=0;step<=10;step++){const progress=step/10,curl=Math.sin(progress*Math.PI*1.3+tendril.phase+time*tendril.speed*.8)*tendril.amplitude*.18*Math.sin(progress*Math.PI);branchPoints.push({x:origin.x+(vx/vlen*.34+nx*.94)*branchLength*progress+(-ny)*curl,y:origin.y+(vy/vlen*.34+ny*.94)*branchLength*progress+nx*curl})}traceOrganicRibbon(context,branchPoints,renderWidth*(.38-branch*.07),tendril.phase+branch,time);context.fillStyle=body;context.fill();context.strokeStyle='rgba(70,20,85,.35)';context.lineWidth=1;context.stroke()}
  context.restore();
 });
 criticalTendrils=criticalTendrils.filter(tendril=>tendril.targetPresence>0||tendril.presence>.002);
 context.globalAlpha=1;context.shadowBlur=0;
}
function startCriticalTendrils(canvas,intensity){
 const nextIntensity=Math.max(0,Math.min(1,intensity||0));
 clearTimeout(criticalTendrilStopTimer);criticalTendrilStopTimer=0;document.querySelector('[data-critical-atmosphere]')?.classList.remove('critical-pd-retracting');
 const dpr=1,sameSize=canvas.width===Math.round(canvas.clientWidth*dpr)&&canvas.height===Math.round(canvas.clientHeight*dpr);
 if(criticalTendrilCanvas===canvas){criticalTendrilTargetIntensity=nextIntensity;reconcileCriticalTendrils(canvas.clientWidth,canvas.clientHeight,nextIntensity);if(criticalTendrilRaf||reducedMotionQuery?.matches){if(reducedMotionQuery?.matches){criticalTendrilIntensity=nextIntensity;criticalTendrils.forEach(t=>t.presence=t.targetPresence);drawCriticalTendrils(canvas,0)}return}}
 else{stopCriticalTendrils();criticalTendrilCanvas=canvas;criticalTendrilIntensity=Math.min(.02,nextIntensity);criticalTendrilTargetIntensity=nextIntensity;criticalTendrils=makeCriticalTendrils(canvas.clientWidth,canvas.clientHeight,nextIntensity)}
 let lastFrame=0;const animate=time=>{if(criticalTendrilCanvas!==canvas)return;criticalTendrilIntensity+=(criticalTendrilTargetIntensity-criticalTendrilIntensity)*.055;if(Math.abs(criticalTendrilTargetIntensity-criticalTendrilIntensity)<.001)criticalTendrilIntensity=criticalTendrilTargetIntensity;try{drawCriticalTendrils(canvas,time)}catch(error){console.error('Erro ao desenhar efeito crítico de PD:',error)}lastFrame=time;criticalTendrilRaf=requestAnimationFrame(animate)};
 if(reducedMotionQuery?.matches){criticalTendrilIntensity=nextIntensity;criticalTendrils.forEach(t=>t.presence=t.targetPresence);drawCriticalTendrils(canvas,0)}else criticalTendrilRaf=requestAnimationFrame(animate);
}
function syncCriticalAtmosphere(){
 const critical=getCriticalState(),isVigilia=state.viewMode==='vigilia',cinematic=state.viewMode==='cinematic'||isVigilia,visible=!document.hidden;
 document.body.style.setProperty('--pv-warning-strength',(.18+critical.pv.warningIntensity*.35).toFixed(3));document.body.style.setProperty('--pd-warning-strength',(.18+critical.pd.warningIntensity*.35).toFixed(3));
 document.body.classList.toggle('warning-pv-state',critical.pv.warning);document.body.classList.toggle('warning-pd-state',critical.pd.warning);document.body.classList.toggle('critical-pv-state',critical.pv.special);document.body.classList.toggle('critical-pd-state',critical.pd.special);document.body.classList.toggle('critical-pd-effects',!isVigilia&&cinematic&&criticalEffects.pd&&critical.pd.special);document.body.classList.toggle('critical-pv-zero',critical.pv.special&&critical.pv.value===0);document.body.classList.toggle('critical-pd-zero',critical.pd.special&&critical.pd.value===0);
 const atmosphere=document.querySelector('[data-critical-atmosphere]');
 if(atmosphere){const pvAtmosphere=criticalEffects.pv&&critical.pv.vignette,pdAtmosphere=criticalEffects.pd&&critical.pd.vignette,pvSpecial=criticalEffects.pv&&critical.pv.special,pdSpecial=criticalEffects.pd&&critical.pd.special;atmosphere.classList.toggle('critical-pv',pvAtmosphere);atmosphere.classList.toggle('critical-pd',pdAtmosphere);atmosphere.classList.toggle('critical-pv-special',pvSpecial);atmosphere.classList.toggle('critical-pd-special',pdSpecial);atmosphere.classList.toggle('critical-combined',pvAtmosphere&&pdAtmosphere);atmosphere.style.setProperty('--pv-vignette-rest',(.1+critical.pv.vignetteIntensity*.6).toFixed(3));atmosphere.style.setProperty('--pv-vignette-peak',(.28+critical.pv.specialIntensity*.65).toFixed(3));atmosphere.style.setProperty('--pv-vignette-echo',(.2+critical.pv.specialIntensity*.54).toFixed(3));atmosphere.style.setProperty('--pd-vignette-opacity',(.32+critical.pd.vignetteIntensity*.65).toFixed(3));if(pdSpecial)atmosphere.style.setProperty('--pd-tendril-opacity',(.1+critical.pd.specialIntensity*.48).toFixed(3));atmosphere.style.setProperty('--pd-distortion-opacity',(.05+critical.pd.specialIntensity*.25).toFixed(3));atmosphere.style.setProperty('--pd-darkness-opacity',(.2+critical.pd.vignetteIntensity*.55).toFixed(3));const canvas=atmosphere.querySelector('[data-critical-tendrils]');if(pdSpecial&&canvas)startCriticalTendrils(canvas,critical.pd.specialIntensity);else if(criticalTendrilCanvas===canvas)retractCriticalTendrils();else stopCriticalTendrils()}else stopCriticalTendrils();
 const audioActive=cinematic&&visible;setCriticalHeartbeat(audioActive&&criticalEffects.pv&&critical.pv.special,critical.pv.specialIntensity);setCriticalPdAudio(audioActive&&criticalEffects.pd&&critical.pd.special,critical.pd.specialIntensity);
}
let _glitchActive=false;
function triggerGlitchTransition(callback){
 document.querySelectorAll('.cinematic-ghost-exit').forEach(el=>el.remove());
 _glitchActive=true;playGlitchSound();
 const CONTENT_SEL='.cinematic-contents, .threat-contents, .vigilia-content-viewport',PAGE_SEL='.cinematic-page, .threat-book-page, .vigilia-page';
 const oldContents=document.querySelector(CONTENT_SEL),oldPage=document.querySelector(PAGE_SEL);
 let oldClone=null,cloneRect=null;
 if(oldContents){
  const isThreat=oldContents.classList.contains('threat-contents');
  oldClone=oldContents.cloneNode(true);
  oldClone.classList.add('cinematic-ghost-exit');
  if(isThreat&&oldPage){
   // a ficha de ameaça rola dentro da página: o fantasma fica na mesma posição visual
   const r=oldContents.getBoundingClientRect(),pr=oldPage.getBoundingClientRect();
   cloneRect={left:r.left-pr.left+oldPage.scrollLeft,top:r.top-pr.top+oldPage.scrollTop,width:r.width,height:r.height};
  }
  const oldScrollables=oldContents.querySelectorAll('.cinematic-scroll, .cinematic-skills>div, .flow-intro'),cloneScrollables=oldClone.querySelectorAll('.cinematic-scroll, .cinematic-skills>div, .flow-intro');
  oldScrollables.forEach((el,i)=>{if(cloneScrollables[i])cloneScrollables[i].scrollTop=el.scrollTop});
  oldClone.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  oldClone.querySelectorAll('[data-cinematic-token]').forEach(el=>el.removeAttribute('data-cinematic-token'));
  oldClone.querySelectorAll('input,button,select,textarea').forEach(el=>el.disabled=true);
 }
 try{callback()}catch(err){console.error('Glitch transition callback error:',err)}
 const page=document.querySelector(PAGE_SEL),newContents=document.querySelector(CONTENT_SEL);
 if(page&&oldClone){
  if(cloneRect&&page.classList.contains('threat-book-page'))Object.assign(oldClone.style,{position:'absolute',left:cloneRect.left+'px',top:cloneRect.top+'px',width:cloneRect.width+'px',height:cloneRect.height+'px',inset:'auto'});
  page.appendChild(oldClone);setTimeout(()=>{oldClone.remove()},240);
 }
 if(newContents){
  newContents.classList.add('glitch-enter');
  const done=()=>{newContents.classList.remove('glitch-enter');_glitchActive=false};
  newContents.addEventListener('animationend',done,{once:true});
  setTimeout(()=>{newContents.classList.remove('glitch-enter');_glitchActive=false},420);
 }else{_glitchActive=false}
}

function applyTextFormat(type){const textarea=document.querySelector('#card-form textarea[name="content"]');if(!textarea)return;const start=textarea.selectionStart,end=textarea.selectionEnd,selected=textarea.value.slice(start,end)||'texto';let before='',after='';if(type==='bold'){before='**';after='**'}if(type==='italic'){before='*';after='*'}if(type==='underline'){before='[u]';after='[/u]'}if(type==='color'){before=`[color=${document.querySelector('#content-color').value}]`;after='[/color]'}textarea.setRangeText(`${before}${selected}${after}`,start,end,'select');textarea.focus()}
const tokenAlphaProfileCache=new Map();
function getTokenAlphaProfile(token){if(!token)return null;const key=token.currentSrc||token.src||token.getAttribute('src');if(key&&tokenAlphaProfileCache.has(key))return tokenAlphaProfileCache.get(key);if(!token.complete||!token.naturalWidth)return null;try{const scale=Math.min(1,180/Math.max(token.naturalWidth,token.naturalHeight)),width=Math.max(1,Math.round(token.naturalWidth*scale)),height=Math.max(1,Math.round(token.naturalHeight*scale)),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(token,0,0,width,height);const pixels=context.getImageData(0,0,width,height).data,rows=Array.from({length:height},()=>[width,-1]);let globalMin=width,globalMax=-1;for(let y=0;y<height;y++){const rowOffset=y*width*4,rowEntry=rows[y];for(let x=0;x<width;x++){if(pixels[rowOffset+x*4+3]>22){if(x<rowEntry[0])rowEntry[0]=x;if(x>rowEntry[1])rowEntry[1]=x;if(x<globalMin)globalMin=x;if(x>globalMax)globalMax=x}}}const profile={width,height,rows,globalMin:globalMax>=0?globalMin:0,globalMax:globalMax>=0?globalMax:width};if(key)tokenAlphaProfileCache.set(key,profile);return profile}catch{return null}}
function tokenRangeAtY(profile,tokenRect,pageY){if(!profile)return null;const naturalY=(pageY-tokenRect.top)/tokenRect.height*profile.height,band=Math.max(2,Math.ceil(24/tokenRect.height*profile.height));if(naturalY<-band||naturalY>profile.height+band)return null;let min=profile.width,max=-1;const startY=Math.max(0,Math.floor(naturalY-band)),endY=Math.min(profile.height-1,Math.ceil(naturalY+band));for(let y=startY;y<=endY;y++){const r=profile.rows[y];if(r[0]<min)min=r[0];if(r[1]>max)max=r[1]}return max<0?null:{left:tokenRect.left+min/profile.width*tokenRect.width,right:tokenRect.left+(max+1)/profile.width*tokenRect.width}}
let cinematicLineMaskRaf=0;
function syncCinematicLineMask(){const page=document.querySelector('.cinematic-page'),frame=document.querySelector('.cinematic-frame'),token=document.querySelector('[data-cinematic-token]'),rightPanel=document.querySelector('.cinematic-right');if(!frame||!page)return;if(!token){frame.querySelectorAll('.cinematic-frame-line').forEach(line=>line.classList.remove('masked'));currentResourceShift=120;page.style.setProperty('--resource-shift','120px');return}if(cinematicLineMaskRaf)cancelAnimationFrame(cinematicLineMaskRaf);cinematicLineMaskRaf=requestAnimationFrame(()=>{cinematicLineMaskRaf=0;const frameRect=frame.getBoundingClientRect(),tokenRect=token.getBoundingClientRect();if(!tokenRect.width||!tokenRect.height)return;const profile=getTokenAlphaProfile(token);const lines=Array.from(frame.querySelectorAll('.cinematic-frame-line'));const lineTops=lines.map(line=>line.getBoundingClientRect().top);const rightRect=rightPanel?rightPanel.getBoundingClientRect():null;lines.forEach((line,i)=>{const lineY=lineTops[i],range=tokenRangeAtY(profile,tokenRect,lineY);if(!range){line.classList.remove('masked');return}const buffer=22,left=Math.max(0,range.left-frameRect.left-buffer),right=Math.min(frameRect.width,range.right-frameRect.left+buffer);line.style.setProperty('--line-cut-left',`${left}px`);line.style.setProperty('--line-cut-right',`${right}px`);line.classList.add('masked')});if(rightRect){const visibleRight=profile?tokenRect.left+(profile.globalMax+1)/profile.width*tokenRect.width:tokenRect.right,shift=Math.max(0,Math.min(150,rightRect.left-visibleRight-24));currentResourceShift=shift;page.style.setProperty('--resource-shift',`${shift}px`)}})}
function bindCinematicToken(){syncTokenOutlineFilter();const area=document.querySelector('[data-cinematic-character]'),token=document.querySelector('[data-cinematic-token]'),scale=document.querySelector('[data-cinematic-scale]');if(token){token.addEventListener('load',syncCinematicLineMask,{once:true});syncCinematicLineMask()}if(scale)scale.oninput=()=>{state.cinematicTokenScale=Number(scale.value);if(token)token.style.setProperty('--token-scale',state.cinematicTokenScale/100);syncCinematicLineMask()};if(scale)scale.onchange=()=>save(false);document.querySelectorAll('[data-outline-side]').forEach(btn=>{btn.onclick=()=>{state.cinematicOutlineSide=btn.dataset.outlineSide;document.querySelectorAll('[data-outline-side]').forEach(b=>b.classList.toggle('active',b===btn));syncTokenOutlineFilter();save(false)}});const outlineIntensity=document.querySelector('[data-cinematic-outline-intensity]');if(outlineIntensity){outlineIntensity.oninput=()=>{state.cinematicOutlineIntensity=Number(outlineIntensity.value)/100;syncTokenOutlineFilter()};outlineIntensity.onchange=()=>save(false)}const outlineWidth=document.querySelector('[data-cinematic-outline-width]');if(outlineWidth){outlineWidth.oninput=()=>{state.cinematicOutlineWidth=Number(outlineWidth.value);syncTokenOutlineFilter()};outlineWidth.onchange=()=>save(false)}const outlineFade=document.querySelector('[data-cinematic-outline-fade]');if(outlineFade){outlineFade.oninput=()=>{state.cinematicOutlineFade=Number(outlineFade.value);syncTokenOutlineFilter()};outlineFade.onchange=()=>save(false)}const btnUpscale=document.querySelector('[data-upscale-token]');if(btnUpscale){btnUpscale.onclick=async()=>{if(!state.tokenImage)return;const orig=btnUpscale.innerHTML;btnUpscale.disabled=true;btnUpscale.innerHTML=`${icon('sparkles',14)} PROCESSANDO...`;try{const enhanced=await upscaleAndEnhanceImage(state.tokenImage,{scale:2,sharpness:1.1});if(enhanced){state.tokenImage=enhanced;save(false);render();const toast=document.querySelector('#save-toast');if(toast){toast.textContent='TOKEN EM ALTA DEFINIÇÃO (2X HD)!';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1500)}}}catch(e){console.error(e);alert('Erro ao processar upscaling.')}finally{if(btnUpscale){btnUpscale.disabled=false;btnUpscale.innerHTML=orig}}}}document.querySelector('[data-reset-cinematic-token]')?.addEventListener('click',()=>{state.cinematicTokenX=50;state.cinematicTokenY=52;state.cinematicTokenScale=100;save();render()});if(!editMode||!area||!token)return;token.onpointerdown=event=>{event.preventDefault();const rect=area.getBoundingClientRect(),startX=event.clientX,startY=event.clientY,originX=state.cinematicTokenX,originY=state.cinematicTokenY;token.setPointerCapture(event.pointerId);token.classList.add('dragging');token.onpointermove=move=>{state.cinematicTokenX=Math.max(0,Math.min(100,originX+(move.clientX-startX)/rect.width*100));state.cinematicTokenY=Math.max(0,Math.min(100,originY+(move.clientY-startY)/rect.height*100));token.style.left=`${state.cinematicTokenX}%`;token.style.top=`${state.cinematicTokenY}%`;syncCinematicLineMask()};token.onpointerup=()=>{token.classList.remove('dragging');token.onpointermove=null;syncCinematicLineMask();save(false)}}}
function updateResourceUi(key){const current=state[key],temp=state[`${key}Temp`]||0,isPv=key.toLowerCase()==='pv',cinDiv=document.querySelectorAll('.cinematic-resources>div')[isPv?0:1],tempBadge=temp?`<button type="button" class="temp-badge-btn" data-consume-temp="${key}:1" title="Clique para extinguir 1 ${key.toUpperCase()} temporário (Botão direito para extinguir todos)"><em>+${temp}</em></button>`:'';if(cinDiv){const b=cinDiv.querySelector('b');if(b)b.innerHTML=`${current}${tempBadge}`;const pips=cinDiv.querySelectorAll('.pip:not(.temporary)');pips.forEach((pip,i)=>pip.classList.toggle('filled',i<current))}document.querySelectorAll(`.resource-row [data-set-resource^="${key}:"]`).forEach(pip=>{const val=Number(pip.dataset.setResource.split(':')[1]);pip.classList.toggle('filled',val<=current)});document.querySelectorAll('.resource-row').forEach(row=>{if(row.querySelector(`[data-set-resource^="${key}:"]`)){const b=row.querySelector('b');if(b)b.innerHTML=`${current}${tempBadge}`}});document.querySelectorAll(`.vigilia-resource-block.resource-${key.toLowerCase()}`).forEach(block=>{const numEl=block.querySelector('.res-num');if(numEl)numEl.textContent=current;const pips=block.querySelectorAll('.vigilia-pip:not(.temp-pip)');pips.forEach((pip,i)=>pip.classList.toggle('filled',i<current))});if(state.viewMode==='vigilia'){if(key.toLowerCase()==='pv'&&state.pv<=0){const modal=document.querySelector('#vigilia-lesao-modal');if(modal)modal.style.display='flex';}if(key.toLowerCase()==='pd'&&state.pd<=0){const modal=document.querySelector('#vigilia-trauma-modal');if(modal)modal.style.display='flex';}}syncCriticalAtmosphere()}
function updateMarkerUi(cardId,markerId){const card=state.cards.find(c=>c.id===cardId),marker=card?.markers.find(m=>m.id===markerId);if(!marker)return;const max=markerMax(marker),current=Math.min(Number(marker.current)||0,max||999),id=`${cardId}:${markerId}`;document.querySelectorAll(`[data-card-marker^="${id}:"],[data-card-marker-set^="${id}:"]`).forEach(el=>{const container=el.closest('.card-marker');if(!container)return;const toggle=container.querySelector('.toggle-switch');if(toggle){toggle.classList.toggle('on',!!current);toggle.innerHTML=`<i></i>${current?'LIGADO':'DESLIGADO'}`}const track=container.querySelector('.progress-track i');if(track)track.style.width=`${max?current/max*100:0}%`;const charges=container.querySelectorAll('.charge');charges.forEach((btn,i)=>btn.classList.toggle('on',i<current));const strong=container.querySelector('strong');if(strong){if(container.classList.contains('marker-bar')||container.classList.contains('marker-pips')){strong.textContent=`${current}/${max}`}else if(!container.classList.contains('marker-toggle')){strong.textContent=`${current}${max?`/${max}`:''}`}}});if(cardId==='impeto'||markerId==='impeto-m'||card?.title?.toUpperCase().includes('ÍMPETO')){document.querySelectorAll('.impeto-slot-pip, .impeto-segment').forEach((pip,i)=>pip.classList.toggle('filled',i<current))}if(cardId==='analise'||markerId==='analise-m'||card?.title?.toUpperCase().includes('ANÁLISE')){document.querySelectorAll('.analise-slot-pip').forEach((pip,i)=>pip.classList.toggle('filled',i<current))}}
let isExportingCinematicImage=false;
async function exportCinematicImage(){
 const toast=document.querySelector('#save-toast');
 const showToastMsg=(msg,duration=2200)=>{
  if(toast){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},duration)}
 };
 if(state.systemMode==='threat'){
  openThreatExportModal(state,{showToastMsg});
  return;
 }
 if(isExportingCinematicImage)return;
 isExportingCinematicImage=true;
 showToastMsg('RENDERIZANDO IMAGEM HD...',4500);
 const prevViewMode=state.viewMode,prevEditMode=editMode;
 let switched=false;
 try{
  if(state.viewMode!=='cinematic'){state.viewMode='cinematic';switched=true}
  if(editMode){editMode=false;switched=true}
  if(switched){render();await new Promise(r=>setTimeout(r,120))}
  const cinematicPage=document.querySelector('.cinematic-page');
  if(!cinematicPage){showToastMsg('ERRO: FICHA NÃO ENCONTRADA',2200);return}
  document.body.classList.add('exporting-cinematic');
  cinematicPage.classList.add('is-exporting');
  const svgDefs=document.querySelector('#token-svg-defs');
  let clonedDefs=null;
  if(svgDefs){
   clonedDefs=svgDefs.cloneNode(true);
   clonedDefs.id='token-svg-defs-capture';
   cinematicPage.appendChild(clonedDefs);
  }
  const videoEl=cinematicPage.querySelector('.bg-video');
  let videoCanvas=null;
  if(videoEl&&videoEl.videoWidth>0){
   try{
    videoCanvas=document.createElement('canvas');
    videoCanvas.width=videoEl.videoWidth;
    videoCanvas.height=videoEl.videoHeight;
    videoCanvas.className='bg-video bg-video-snapshot';
    const vCtx=videoCanvas.getContext('2d');
    vCtx.drawImage(videoEl,0,0,videoCanvas.width,videoCanvas.height);
    videoEl.style.display='none';
    videoEl.parentNode.insertBefore(videoCanvas,videoEl);
   }catch(e){console.warn('Snapshot video bg error:',e)}
  }
  const {toPng}=await import('html-to-image');
  const filter=(node)=>{
   if(node.nodeType!==1)return true;
   const cl=node.classList;
   if(!cl)return true;
   return !(
    cl.contains('cinematic-agent-bar')||
    cl.contains('btn-export-image-cinematic')||
    cl.contains('floating')||
    cl.contains('view-mode-switch')||
    cl.contains('edit-status')||
    cl.contains('mobile-bottom-nav')||
    cl.contains('sheet-drawer')||
    cl.contains('sheet-drawer-backdrop')||
    cl.contains('roll-log-drawer')||
    cl.contains('roll-log-backdrop')||
    cl.contains('save-toast')||
    cl.contains('rotate-prompt')||
    cl.contains('cinematic-token-tools')||
    cl.contains('cinematic-card-edit')||
    cl.contains('cinematic-section-add')||
    cl.contains('cinematic-add-aptidao')||
    cl.contains('btn-remove-aptidao')||
    cl.contains('skill-info-button')
   );
  };
  await new Promise(r=>setTimeout(r,80));
  const dataUrl=await toPng(cinematicPage,{
   pixelRatio:2,
   quality:0.98,
   filter,
   style:{margin:'0',marginLeft:'0'}
  });
  const cleanName=(state.name||'Agente').trim().replace(/[/\\?%*:|"<>]/g,'-');
  const filename=`${cleanName} - Ficha Cinematográfica.png`;
  const link=document.createElement('a');
  link.href=dataUrl;
  link.download=filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToastMsg('FOTO HD EXPORTADA COM SUCESSO!',2500);
 }catch(error){
  console.error('Erro ao exportar imagem:',error);
  showToastMsg('ERRO AO EXPORTAR IMAGEM',2500);
 }finally{
  const cinematicPage=document.querySelector('.cinematic-page');
  if(cinematicPage){
   cinematicPage.classList.remove('is-exporting');
   const clonedDefs=cinematicPage.querySelector('#token-svg-defs-capture');
   if(clonedDefs)clonedDefs.remove();
   const videoCanvas=cinematicPage.querySelector('.bg-video-snapshot');
   if(videoCanvas){
    videoCanvas.remove();
    const videoEl=cinematicPage.querySelector('.bg-video');
    if(videoEl)videoEl.style.display='';
   }
  }
  document.body.classList.remove('exporting-cinematic');
  if(state.viewMode!==prevViewMode||editMode!==prevEditMode){
   state.viewMode=prevViewMode;
   editMode=prevEditMode;
   render();
  }
  isExportingCinematicImage=false;
 }
}

function bind(){
 function notifyPresentationLocked(){const toast=document.querySelector('#save-toast');if(toast){toast.textContent='SELECIONE O PERSONAGEM PRIMEIRO';toast.classList.add('show');setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},1500)}}
 document.querySelector('[data-request-landscape]')?.addEventListener('click',requestLandscapePresentation);
 document.querySelector('[data-install-app]')?.addEventListener('click',requestAppInstall);
 document.querySelector('[data-critical-settings]')?.addEventListener('click',()=>document.querySelector('#critical-settings-modal')?.classList.add('open'));
 document.querySelectorAll('.critical-settings-close,.critical-settings-backdrop').forEach(el=>el.onclick=()=>document.querySelector('#critical-settings-modal')?.classList.remove('open'));
 document.querySelectorAll('[data-app-setting]').forEach(button=>button.onclick=()=>{const key=button.dataset.appSetting;appSettings[key]=!appSettings[key];saveAppSettings();button.classList.toggle('active',appSettings[key]);button.setAttribute('aria-pressed',String(appSettings[key]));const label=button.querySelector('em');if(label)label.textContent=appSettings[key]?'ATIVO':'DESATIVADO'});
 document.querySelectorAll('[data-critical-effect]').forEach(button=>button.onclick=()=>{const key=button.dataset.criticalEffect;criticalEffects[key]=!criticalEffects[key];saveCriticalEffects();button.classList.toggle('active',criticalEffects[key]);button.setAttribute('aria-pressed',String(criticalEffects[key]));const label=button.querySelector('em');if(label)label.textContent=criticalEffects[key]?'ATIVO':'DESATIVADO';syncCriticalAtmosphere()});
 document.querySelectorAll('[data-field]').forEach(el=>el.onchange=e=>{if(presentationMode){notifyPresentationLocked();return;}const key=e.target.dataset.field;state[key]=key==='level'?Math.max(0,Number(e.target.value)||0):e.target.value;save(false);render()});
 document.querySelectorAll('[data-set-resource]').forEach(el=>el.onclick=()=>{if(presentationMode){notifyPresentationLocked();return;}const[key,val]=el.dataset.setResource.split(':'),previous=state[key];state[key]=state[key]===Number(val)?Number(val)-1:Number(val);if(key==='pv'||key==='pd')playResourceSound(state[key]>previous);save(false);updateResourceUi(key)});
  document.querySelectorAll('[data-consume-temp]').forEach(el=>{el.onclick=e=>{e.preventDefault();e.stopPropagation();if(presentationMode){notifyPresentationLocked();return;}const[key,valStr]=el.dataset.consumeTemp.split(':'),tempKey=`${key}Temp`,current=Number(state[tempKey])||0;if(current<=0)return;const isBadge=el.classList.contains('temp-badge-btn'),val=Number(valStr);let next;if(isBadge){next=Math.max(0,current-1)}else{next=current===val?Math.max(0,val-1):Math.max(0,val)}if(next===current)next=Math.max(0,current-1);state[tempKey]=next;playResourceSound(false);save(false);render();const toast=document.querySelector('#save-toast');if(toast){toast.textContent=next===0?`${key.toUpperCase()} TEMPORÁRIO EXTINTO`:`${key.toUpperCase()} TEMPORÁRIO: +${next}`;toast.classList.add('show');setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},1500)}};el.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();if(presentationMode){notifyPresentationLocked();return;}const[key]=el.dataset.consumeTemp.split(':'),tempKey=`${key}Temp`,current=Number(state[tempKey])||0;if(current<=0)return;state[tempKey]=0;playResourceSound(false);save(false);render();const toast=document.querySelector('#save-toast');if(toast){toast.textContent=`${key.toUpperCase()} TEMPORÁRIO EXTINTO`;toast.classList.add('show');setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},1500)}}});
 document.querySelectorAll('[data-resource-adjust]').forEach(el=>el.onclick=()=>{if(presentationMode){notifyPresentationLocked();return;}const[key,delta]=el.dataset.resourceAdjust.split(':');state[key]=Math.max(0,Number(state[key]||0)+Number(delta));if(key==='maxPv')state.pv=Math.min(state.pv,state[key]);if(key==='maxPd')state.pd=Math.min(state.pd,state[key]);if(key.toLowerCase().includes('pv')||key.toLowerCase().includes('pd'))playResourceSound(Number(delta)>0);save(false);render()});
 document.querySelectorAll('[data-attribute-step]').forEach(el=>el.onclick=()=>{if(presentationMode){notifyPresentationLocked();return;}const[name,delta]=el.dataset.attributeStep.split(':'),at=DICE_STEPS.indexOf(state.attributes[name]);state.attributes[name]=DICE_STEPS[Math.max(0,Math.min(DICE_STEPS.length-1,at+Number(delta)))];save(false);render()});
 document.querySelectorAll('[data-skill-extra]').forEach(el=>el.onchange=()=>{const rawId=el.dataset.skillExtra,numIdx=Number(rawId);if(!isNaN(numIdx)&&state.skills&&state.skills[numIdx]){state.skills[numIdx].extra=Number(el.value)||0}else if(state.pericias&&state.pericias[rawId]){state.pericias[rawId].extra=Number(el.value)||0}save(false)});
 document.querySelectorAll('[data-roll]').forEach(el=>el.onclick=e=>{if(e.target.closest('.custom-select,.extra input,[data-skill-extra],.card-actions,.skill-info-button,[data-remove-aptidao],[data-add-aptidao],.btn-remove-aptidao'))return;if(presentationMode){notifyPresentationLocked();return;}const[name,sides,bonus]=el.dataset.roll.split('|');roll(name,sides,bonus)});
  document.querySelectorAll('[data-expression]').forEach(el=>el.onclick=async()=>{if(presentationMode){notifyPresentationLocked();return;}const cardId=el.dataset.cardId,actionId=el.dataset.actionId,card=cardId?state.cards.find(c=>c.id===cardId):null,action=card?.actions?.find(a=>a.id===actionId),res=await rollExpression(el.dataset.rollTitle,el.dataset.expression);if(!res||!Array.isArray(res.values)||!card)return;const targetMarker=card.markers?.find(m=>m.id===action?.targetMarker)||card.markers?.find(m=>m.type==='slots');if(targetMarker&&targetMarker.type==='slots'){const max=markerMax(targetMarker);if(!Array.isArray(targetMarker.slots))targetMarker.slots=[];targetMarker.slots=res.values.slice(0,max);while(targetMarker.slots.length<max)targetMarker.slots.push(null);targetMarker.current=targetMarker.slots.filter(v=>v!==null&&v!==undefined&&v!=='').length;save(false);render();const toast=document.querySelector('#save-toast');if(toast){toast.textContent=`${(targetMarker.label||'Slots').toUpperCase()} PREENCHIDA COM [ ${targetMarker.slots.filter(v=>v!==null).join(', ')} ]!`;toast.classList.add('show');setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},2200)}}});
  document.querySelectorAll('[data-card-marker]').forEach(el=>el.onclick=()=>{if(presentationMode){notifyPresentationLocked();return;}const[cardId,markerId,action]=el.dataset.cardMarker.split(':'),marker=state.cards.find(c=>c.id===cardId)?.markers.find(m=>m.id===markerId);if(!marker)return;const max=markerMax(marker);marker.current=action==='toggle'?(marker.current?0:1):Math.max(0,Math.min(max||999,(Number(marker.current)||0)+Number(action)));save(false);updateMarkerUi(cardId,markerId)});
  document.querySelectorAll('[data-card-marker-set]').forEach(el=>el.onclick=()=>{if(presentationMode){notifyPresentationLocked();return;}const[cardId,markerId,value]=el.dataset.cardMarkerSet.split(':'),marker=state.cards.find(c=>c.id===cardId)?.markers.find(m=>m.id===markerId);if(marker){marker.current=marker.current===Number(value)?Number(value)-1:Number(value);save(false);updateMarkerUi(cardId,markerId)}});
  document.querySelectorAll('[data-use-slot]').forEach(el=>{el.onclick=()=>{if(presentationMode){notifyPresentationLocked();return;}const[cardId,markerId,slotIdxStr]=el.dataset.useSlot.split(':'),slotIndex=Number(slotIdxStr),card=state.cards.find(c=>c.id===cardId),marker=card?.markers.find(m=>m.id===markerId);if(!card||!marker)return;if(!Array.isArray(marker.slots))marker.slots=[];const val=marker.slots[slotIndex];if(val!==null&&val!==undefined&&val!==''){marker.slots[slotIndex]=null;marker.current=marker.slots.filter(v=>v!==null&&v!==undefined&&v!=='').length;playResourceSound(false);save(false);render();const toast=document.querySelector('#save-toast');if(toast){toast.textContent=`VALOR [ ${val} ] UTILIZADO!`;toast.classList.add('show');setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},1800)}}else{openSlotModal(card,marker,slotIndex)}};el.oncontextmenu=e=>{e.preventDefault();if(presentationMode){notifyPresentationLocked();return;}const[cardId,markerId,slotIdxStr]=el.dataset.useSlot.split(':'),slotIndex=Number(slotIdxStr),card=state.cards.find(c=>c.id===cardId),marker=card?.markers.find(m=>m.id===markerId);if(card&&marker)openSlotModal(card,marker,slotIndex)}});
  document.querySelectorAll('[data-fill-marker]').forEach(el=>el.onclick=()=>{if(presentationMode){notifyPresentationLocked();return;}const[cardId,markerId]=el.dataset.fillMarker.split(':'),card=state.cards.find(c=>c.id===cardId),marker=card?.markers.find(m=>m.id===markerId);if(!card||!marker)return;const max=markerMax(marker);if(!Array.isArray(marker.slots))marker.slots=[];let targetIdx=-1;for(let i=0;i<max;i++){if(marker.slots[i]===null||marker.slots[i]===undefined||marker.slots[i]===''){targetIdx=i;break}}if(targetIdx===-1)targetIdx=0;openSlotModal(card,marker,targetIdx)});
  document.querySelectorAll('.slot-fill-close,.slot-fill-backdrop').forEach(el=>el.onclick=closeSlotModal);
  document.querySelectorAll('[data-pick-val]').forEach(el=>el.onclick=()=>applySlotValue(Number(el.dataset.pickVal)));
  const btnSlotRoll=document.querySelector('#btn-slot-roll-die');if(btnSlotRoll){btnSlotRoll.onclick=async()=>{const savedTarget=activeSlotTarget;document.querySelector('#slot-fill-modal')?.classList.remove('open');const res=await roll('Preencher Espaço',[6],0);if(res&&Array.isArray(res.values)&&res.values.length>0){activeSlotTarget=savedTarget;applySlotValue(res.values[0])}else{activeSlotTarget=null}}};
  const btnConfirmManual=document.querySelector('#btn-slot-confirm-manual');if(btnConfirmManual){btnConfirmManual.onclick=()=>{const input=document.querySelector('#slot-manual-val');if(input&&input.value!=='')applySlotValue(Number(input.value)||input.value)}};
  const inputManual=document.querySelector('#slot-manual-val');if(inputManual){inputManual.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();if(inputManual.value!=='')applySlotValue(Number(inputManual.value)||inputManual.value)}}};
  document.querySelectorAll('.custom-select').forEach(select=>{const trigger=select.querySelector('.select-trigger');trigger.onclick=e=>{e.stopPropagation();document.querySelectorAll('.custom-select.open').forEach(other=>other!==select&&other.classList.remove('open'));select.classList.toggle('open');setTimeout(()=>document.addEventListener('click',()=>select.classList.remove('open'),{once:true}))};select.querySelectorAll('.select-option').forEach(option=>option.onclick=e=>{e.stopPropagation();const value=option.dataset.selectValue,id=select.dataset.selectId;setSelectVisual(id,value);select.classList.remove('open');if(id==='profile'){state.profile=value;ensureProfileAbility(state,value)}else if(id.startsWith('skill-training:')){const skill=state.skills[Number(id.split(':')[1])],entry=TRAINING.find(([label])=>label===value);skill.training=value;skill.skillDie=entry[1]}else if(id.startsWith('skill-attribute:'))state.skills[Number(id.split(':')[1])].attribute=value;else if(id.startsWith('aptidao-field:')){const idx=Number(id.split(':')[1]);if(state.skills[idx])state.skills[idx].name=`APTIDÃO (${value})`}else return;save(false);render()})});
  document.querySelectorAll('[data-add-aptidao]').forEach(el=>el.onclick=()=>{const usedFields=new Set();state.skills.forEach(s=>{if(s.name.startsWith('APTIDÃO')){const m=s.name.match(/\(([^)]+)\)/);if(m)usedFields.add(m[1].toUpperCase())}});const nextField=APTIDAO_FIELDS.find(f=>!usedFields.has(f))||'ARTES';const newSkill={name:`APTIDÃO (${nextField})`,training:'DESTREINADO',skillDie:4,attribute:'Mente',extra:0};let lastIdx=-1;state.skills.forEach((s,idx)=>{if(s.name.startsWith('APTIDÃO'))lastIdx=idx});if(lastIdx>=0)state.skills.splice(lastIdx+1,0,newSkill);else state.skills.push(newSkill);save(false);render()});
  document.querySelectorAll('[data-remove-aptidao]').forEach(el=>el.onclick=e=>{e.stopPropagation();const idx=Number(el.dataset.removeAptidao);const count=state.skills.filter(s=>s.name.startsWith('APTIDÃO')).length;if(count>1&&!isNaN(idx)&&state.skills[idx]){state.skills.splice(idx,1);save(false);render()}});
  document.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>{if(el.dataset.view===currentView)return;const old=document.querySelector(`#${currentView}-view`),next=document.querySelector(`#${el.dataset.view}-view`);document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===el));old.classList.add('leaving');setTimeout(()=>{old.classList.remove('active','leaving');next.classList.add('active','entering');setTimeout(()=>next.classList.remove('entering'),300);currentView=el.dataset.view},180)});
  document.querySelectorAll('[data-toggle-edit]').forEach(el=>{
   el.onclick=()=>{
    if(presentationMode && state.systemMode !== 'threat'){notifyPresentationLocked();return;}
    editTransitionMode=editMode?'into-view':'into-edit';
    editMode=!editMode;
    playModeToggleSound(editMode);
    save(false);
    render();
   };
  });
  document.querySelectorAll('[data-export-cinematic-image]').forEach(el=>{
   el.onclick=()=>exportCinematicImage();
  });
  document.querySelectorAll('[data-right]').forEach(el=>el.onclick=()=>{const nextRight=el.dataset.right;if(nextRight===currentRight)return;const oldPanel=document.querySelector(`#${currentRight}`),newPanel=document.querySelector(`#${nextRight}`);currentRight=nextRight;document.querySelectorAll('[data-right]').forEach(button=>button.classList.toggle('active',button===el));if(oldPanel)oldPanel.classList.add('leaving');setTimeout(()=>{if(oldPanel)oldPanel.classList.remove('active','leaving');if(newPanel){newPanel.classList.add('active','entering');setTimeout(()=>newPanel.classList.remove('entering'),280)}},180)});
  const filter=document.querySelector('#filter');if(filter)filter.oninput=e=>document.querySelectorAll('.right-content.active [data-filter]').forEach(x=>x.hidden=!x.dataset.filter.includes(e.target.value.toLowerCase()));const traditionalAdd=document.querySelector('.right-tools .add');if(traditionalAdd)traditionalAdd.onclick=()=>openCardEditor();document.querySelectorAll('[data-cinematic-add]').forEach(el=>el.onclick=()=>{currentRight=el.dataset.cinematicAdd;openCardEditor()});document.querySelectorAll('[data-cinematic-section-toggle]').forEach(el=>el.onclick=()=>{const key=el.dataset.cinematicSectionToggle;if(presentationMode&&(key==='items'||key==='history')){playLockRattleSound();notifyPresentationLocked();const lockEl=el.querySelector('.cinematic-section-lock');if(lockEl){lockEl.classList.remove('lock-denied');void lockEl.offsetWidth;lockEl.classList.add('lock-denied')}return;}const group=el.closest('.cinematic-section-group');state.cinematicCollapsed[key]=!state.cinematicCollapsed[key];group.classList.toggle('collapsed',state.cinematicCollapsed[key]);el.setAttribute('aria-expanded',String(!state.cinematicCollapsed[key]));save(false)});
  document.querySelectorAll('[data-edit-card]').forEach(el=>el.onclick=()=>openCardEditor(el.dataset.editCard));document.querySelectorAll('[data-toggle-card]').forEach(el=>el.onclick=()=>{const c=state.cards.find(x=>x.id===el.dataset.toggleCard);c.collapsed=!c.collapsed;save(false);render()});
  document.querySelectorAll('[data-duplicate-card]').forEach(el=>el.onclick=()=>{const c=state.cards.find(x=>x.id===el.dataset.duplicateCard),copy={...clone(c),id:makeId('card'),title:`${c.title} — CÓPIA`};copy.markers.forEach(m=>m.id=makeId('marker'));copy.actions.forEach(a=>a.id=makeId('action'));state.cards.splice(state.cards.indexOf(c)+1,0,copy);save(false);render()});
  document.querySelectorAll('[data-move]').forEach(el=>el.onclick=()=>{const[id,delta]=el.dataset.move.split(':'),from=state.cards.findIndex(c=>c.id===id),to=Math.max(0,Math.min(state.cards.length-1,from+Number(delta)));if(from!==to){const[c]=state.cards.splice(from,1);state.cards.splice(to,0,c);save(false);render()}});
  document.querySelectorAll('.resource-card').forEach(card=>{card.ondragstart=e=>e.dataTransfer.setData('text/card-id',card.dataset.cardId);card.ondragover=e=>e.preventDefault();card.ondrop=e=>{e.preventDefault();const from=state.cards.findIndex(c=>c.id===e.dataTransfer.getData('text/card-id')),to=state.cards.findIndex(c=>c.id===card.dataset.cardId);if(from>=0&&to>=0&&from!==to){const[moved]=state.cards.splice(from,1);state.cards.splice(to,0,moved);save(false);render()}}});
  document.querySelectorAll('.editor-close,.editor-backdrop').forEach(el=>el.onclick=closeCardEditor);document.querySelectorAll('[data-format]').forEach(el=>el.onclick=()=>applyTextFormat(el.dataset.format));document.querySelectorAll('[data-skill-info]').forEach(el=>el.onclick=e=>{e.stopPropagation();openSkillInfo(Number(el.dataset.skillInfo))});document.querySelectorAll('.skill-info-close,.skill-info-backdrop').forEach(el=>el.onclick=closeSkillInfo);document.querySelector('[data-add-marker]').onclick=()=>{if(editorMarkers.length<5){editorMarkers.push({id:makeId('marker'),type:'counter',displayStyle:'default',label:`Marcador ${editorMarkers.length+1}`,current:0,maxFormula:'@{level} + 2'});renderCardBuilders()}};document.querySelector('[data-add-action]').onclick=()=>{if(editorActions.length<7){editorActions.push({id:makeId('action'),name:`Ação ${editorActions.length+1}`,expression:'1d8'});renderCardBuilders()}};
  document.querySelector('#card-form').onsubmit=e=>{e.preventDefault();const form=e.currentTarget,data=Object.fromEntries(new FormData(form)),existing=state.cards.find(c=>c.id===form.dataset.cardId),card=existing||{id:makeId('card')};Object.assign(card,{schema:data.schema,title:data.title.trim()||'SEM TÍTULO',type:data.type.trim()||'Habilidade',cost:(data.cost||'').trim(),icon:data.icon.trim()||'◆',accent:data.accent,themeLinked:data.colorMode==='profile',layout:data.layout,collapsed:data.collapsed==='true',imageUrl:data.imageUrl.trim(),content:data.content.trim(),markers:clone(editorMarkers),actions:clone(editorActions)});card.markers.forEach(marker=>{marker.current=Math.min(Number(marker.current)||0,marker.type==='toggle'?1:markerMax(marker)||999);if(marker.type==='slots'&&!Array.isArray(marker.slots)){const max=markerMax(marker);marker.slots=Array.from({length:max},()=>null)}});if(!existing)state.cards.push(card);currentRight=card.schema;save(false);closeCardEditor();render()};
  document.querySelector('.delete-card').onclick=()=>{const id=document.querySelector('#card-form').dataset.cardId;if(id){state.cards=state.cards.filter(c=>c.id!==id);save(false);closeCardEditor();render()}};
  document.querySelectorAll('#token-upload,#token-upload-secondary,#token-upload-cinematic').forEach(input=>input.onchange=()=>readImage(input.files[0],'tokenImage',2048));const backgroundUpload=document.querySelector('#background-upload');if(backgroundUpload)backgroundUpload.onchange=()=>readMedia(backgroundUpload.files[0],'backgroundImage');document.querySelectorAll('[data-reset-background]').forEach(el=>el.onclick=()=>{state.backgroundImage='';state.backgroundBlur=0;state.backgroundZoom=100;save(false);render()});document.querySelectorAll('[data-reset-bg-effects]').forEach(el=>el.onclick=()=>{state.backgroundBlur=0;state.backgroundZoom=100;save(false);render()});document.querySelectorAll('[data-cinematic-bg-blur]').forEach(input=>{input.oninput=()=>{const val=Math.max(0,Math.min(50,Number(input.value)||0));state.backgroundBlur=val;document.querySelectorAll('.page,.cinematic-page').forEach(page=>page.style.setProperty('--bg-blur',`${val}px`));const hint=input.parentElement?.querySelector('.slider-val-hint')||document.querySelector('#val-hint-blur');if(hint)hint.textContent=`${val}px`};input.onchange=()=>save(false);input.ondblclick=()=>{state.backgroundBlur=0;save(false);render()}});document.querySelectorAll('[data-cinematic-bg-zoom]').forEach(input=>{input.oninput=()=>{const val=Math.max(20,Math.min(300,Number(input.value)||100));state.backgroundZoom=val;document.querySelectorAll('.page,.cinematic-page').forEach(page=>page.style.setProperty('--bg-zoom',`${val/100}`));const hint=input.parentElement?.querySelector('.slider-val-hint')||document.querySelector('#val-hint-zoom');if(hint)hint.textContent=`${val}%`};input.onchange=()=>save(false);input.ondblclick=()=>{state.backgroundZoom=100;save(false);render()}});document.querySelectorAll('[data-theme-color]').forEach(input=>{input.oninput=()=>{state.themeColor=input.value;document.querySelector('.cinematic-page')?.style.setProperty('--cinematic-accent',input.value);document.documentElement.style.setProperty('--cinematic-accent-ink',inkFor(input.value))};input.onchange=()=>{state.themeColor=input.value;save(false);render()}});document.querySelectorAll('[data-reset-theme-color]').forEach(el=>el.onclick=()=>{state.themeColor='';save(false);render()});const diceColor=document.querySelector('#dice-color');if(diceColor)diceColor.onchange=()=>{state.diceColor=diceColor.value;save(false);render()};document.querySelectorAll('[data-reset-dice-color]').forEach(el=>el.onclick=()=>{state.diceColor='';save(false);render()});
    document.querySelectorAll('[data-sheet-id]').forEach(el=>el.onclick=(e)=>{
     if (isDraggingSheet) {
      e.preventDefault();
      e.stopPropagation();
      return;
     }
     switchToSheet(el.dataset.sheetId);
    });
    document.querySelectorAll('[data-new-sheet]').forEach(el=>el.onclick=()=>{
     if(presentationMode && state.systemMode !== 'threat'){notifyPresentationLocked();return;}
     const modal=document.querySelector('#system-select-modal');
     if(modal) modal.style.display='flex';
    });
    document.querySelectorAll('[data-close-system-modal]').forEach(el=>el.onclick=()=>{
     const modal=document.querySelector('#system-select-modal');
     if(modal) modal.style.display='none';
    });
    document.querySelectorAll('[data-create-system]').forEach(card=>{
     card.onclick=(e)=>{
      const mode=card.dataset.createSystem||e.currentTarget?.dataset?.createSystem||'ordem2';
      const modal=document.querySelector('#system-select-modal');
      if(modal) modal.style.display='none';
      save(false);
      editMode=false;
      const currentMode=state.viewMode||'cinematic';
      const defaultFolderId=targetFolderForNewSheet||(mode==='threat'?'folder-threats':'folder-characters');
      targetFolderForNewSheet=null;
      const inicioOriginal=mode==='original'
        ?{classeId:'sobrevivente',nex:0,trilhaId:'durao',atributos:{for:1,agi:1,vig:1,int:1,pre:1}}
        :(mode==='threat'?{vd:60,elementos:['sangue'],pv:120,maxPv:120,fonte:'homebrew',isCustom:true}:{});
      const sheetName=mode==='threat'
        ?`AMEAÇA ${sheets.filter(isThreatSheet).length+1}`
        :`AGENTE ${sheets.filter(isCharacterSheet).length+1}`;
      const sheet=normalizeSheet({name:sheetName,systemMode:mode,folderId:defaultFolderId,viewMode:currentMode,...inicioOriginal});
      sheets.push(sheet);
      state=sheet;
      activeSheetId=sheet.id;
      trackRecentSheet(sheet.id);
      if(mode==='original'){
       abrirTutorial(sheet,{soRecursos:!appSettings.tutorialOriginal,onFinish:()=>{if(state===sheet){save(false);render();}}});
      }else if(mode==='threat'){
       fecharTutorial();
       abrirThreatWizard(sheet,{modoInicial:'criar',onFinish:()=>{if(state===sheet){save(false);render();}}});
      }else{
       fecharTutorial();
       fecharThreatWizard();
      }
      if(mode==='threat'){
       presentationMode=false;
      }else{
       presentationIndex=Math.max(0,getPresentationSheets().findIndex(s=>s.id===state.id));
      }
      if(state.viewMode==='cinematic'&&presentationMode){
       triggerGlitchTransition(()=>render());
      }else{
       render();
      }
      setTimeout(()=>{
       const switcher=document.querySelector('.sheet-switcher');
       if(switcher) switcher.scrollTop=switcher.scrollHeight;
      },50);
     };
    });
    document.querySelectorAll('[data-save-sheet]').forEach(el=>el.onclick=()=>save(true,'SALVO',true));
    document.querySelectorAll('[data-export-json]').forEach(el=>el.onclick=()=>exportJsonSheet());
    document.querySelectorAll('[data-import-json]').forEach(el=>el.onclick=()=>{document.querySelector('#json-file-input')?.click()});
    document.querySelectorAll('#json-file-input').forEach(input=>{input.onchange=()=>{if(input.files[0])importJsonSheet(input.files[0]);input.value=''}});
    document.querySelectorAll('[data-compendium]').forEach(el=>el.onclick=()=>{const toast=document.querySelector('#save-toast');if(toast){toast.textContent='COMPÊNDIO — EM BREVE';toast.classList.add('show');setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},1300)}});

  document.querySelectorAll('[data-display-mode]').forEach(el=>el.onclick=()=>{if(el.dataset.displayMode===state.viewMode)return;state.viewMode=el.dataset.displayMode;if(state.viewMode==='cinematic')viewSwitchCollapsed=true;if(state.viewMode==='traditional'||state.viewMode==='vigilia')presentationMode=false;modeJustChanged=true;render()});
  document.querySelectorAll('[data-toggle-view-switch]').forEach(el=>el.onclick=e=>{e.stopPropagation();viewSwitchCollapsed=!viewSwitchCollapsed;render()});

  // ── Modo de Apresentação (Dossiês de Agentes) ───────────────────────────────
  bindPresentationEvents();

  bindCinematicToken();bindSheetInteractions();bindWorkspaceSidebarEvents();bindThreatBookEvents();bindBestiaryLicenseEvents();bindVigiliaEvents();

  // ── Interações do Sistema Original (d20) ───────────────────────────────────
  document.querySelectorAll('[data-original-tab]').forEach(btn=>{
   btn.onclick=()=>{
    const nextTab=btn.dataset.originalTab;
    if(nextTab===currentOriginalTab) return;
    const oldPanel=document.querySelector(`#tab-${currentOriginalTab}`);
    const newPanel=document.querySelector(`#tab-${nextTab}`);
    currentOriginalTab=nextTab;
    document.querySelectorAll('[data-original-tab]').forEach(b=>b.classList.toggle('active',b===btn));
    if(oldPanel) oldPanel.classList.add('leaving');
    setTimeout(()=>{
      if(oldPanel) oldPanel.classList.remove('active','leaving');
      if(newPanel){
        newPanel.classList.add('active','entering');
        setTimeout(()=>newPanel.classList.remove('entering'),280);
      }
    },180);
   };
  });
  const origFilterInput = document.querySelector('#filter-original-skills');
  if(origFilterInput){
   origFilterInput.oninput=(e)=>{
    originalSkillsFilter=e.target.value;
    const q=originalSkillsFilter.toLowerCase();
    document.querySelectorAll('.original-skill-row').forEach(row=>{
     const pId=row.dataset.originalPericia||'';
     const pName=row.querySelector('.skill-title')?.textContent?.toLowerCase()||'';
     row.style.display=(!q||pName.includes(q)||pId.includes(q))?'':'none';
    });
   };
  }
  document.querySelectorAll('[data-original-roll-attr]').forEach(btn=>{
   btn.onclick=(e)=>{
    e.stopPropagation();
    rollOriginalAttribute(btn.dataset.originalRollAttr);
   };
  });
  document.querySelectorAll('[data-attr-step]').forEach(btn=>{
   btn.onclick=(e)=>{
    e.stopPropagation();
    const[attrKey,deltaStr]=btn.dataset.attrStep.split(':');
    const delta=Number(deltaStr)||0;
    if(state.atributos&&attrKey){
     state.atributos[attrKey]=Math.max(0,Math.min(10,(state.atributos[attrKey]??1)+delta));
     save(false);
     render();
    }
   };
  });
  document.querySelectorAll('[data-skill-treino]').forEach(sel=>{
   sel.onchange=()=>{
    if(!editMode) return;
    const pId=sel.dataset.skillTreino;
    if(!state.pericias) state.pericias={};
    if(!state.pericias[pId]) state.pericias[pId]={treino:0,extra:0};
    state.pericias[pId].treino=Number(sel.value)||0;
    save(false);
    render();
   };
  });
  document.querySelectorAll('[data-cycle-treino]').forEach(btn=>{
   btn.onclick=(e)=>{
    e.stopPropagation();
    if(!editMode) return;
    const pId=btn.dataset.cycleTreino;
    if(!state.pericias) state.pericias={};
    if(!state.pericias[pId]) state.pericias[pId]={treino:0,extra:0};
    const curr=Number(state.pericias[pId].treino)||0;
    const cycle=[0,5,10,15];
    const nextIdx=(cycle.indexOf(curr)+1)%cycle.length;
    state.pericias[pId].treino=cycle[nextIdx];
    save(false);
    render();
   };
  });
  document.querySelectorAll('[data-nex-step],[data-nex-set]').forEach(btn=>{
   btn.onclick=()=>{
    if(presentationMode){notifyPresentationLocked();return;}
    const niveis=niveisDaClasse(state);
    const alvo=btn.dataset.nexSet!==undefined?Number(btn.dataset.nexSet):niveis[niveis.indexOf(Number(state.nex)||0)+Number(btn.dataset.nexStep)];
    if(alvo===undefined||!niveis.includes(alvo)||alvo===state.nex) return;
    mudarNexOriginal(()=>{state.nex=alvo;ajustarNexDaClasse(state);});
    save(false);
    render();
   };
  });
  document.querySelectorAll('[data-consume-temp]').forEach(btn=>{
   btn.onclick=(e)=>{
    e.stopPropagation();
    const[key,deltaStr]=btn.dataset.consumeTemp.split(':');
    const tempKey=`${key}Temp`;
    const delta=Number(deltaStr)||1;
    if(state[tempKey]!==undefined&&state[tempKey]>0){
     state[tempKey]=Math.max(0,state[tempKey]-delta);
     save(false);
     render();
    }
   };
  });
  document.querySelectorAll('[data-roll-skill]').forEach(btn=>{
   btn.onclick=(e)=>{
    e.stopPropagation();
    rollOriginalSkill(btn.dataset.rollSkill);
   };
  });
  document.querySelectorAll('[data-res-adjust]').forEach(inp=>{
   inp.onchange=()=>{
    const key=inp.dataset.resAdjust;
    const maxVal=key==='pv'?originalCalcPvMax(state):(key==='pe'?originalCalcPeMax(state):originalCalcSanMax(state));
    const prev=Number(state[key]??maxVal);
    const next=Math.max(0,Math.min(maxVal,Number(inp.value)||0));
    state[key]=next;
    inp.value=next;
    save(false);

    const card=inp.closest('.original-resource-card');
    if(card){
     const fill=card.querySelector('.res-fill');
     if(fill&&maxVal>0) fill.style.width=`${(next/maxVal)*100}%`;
     const animClass=next<prev?'res-flash-damage':'res-flash-heal';
     card.classList.remove('res-flash-damage','res-flash-heal');
     void card.offsetWidth;
     card.classList.add(animClass);
     setTimeout(()=>card.classList.remove(animClass),400);
     return;
    }
    render();
   };
  });
  document.querySelectorAll('[data-res-delta]').forEach(btn=>{
   btn.onclick=()=>{
    const[key,deltaStr]=btn.dataset.resDelta.split(':');
    const delta=Number(deltaStr)||0;
    const maxVal=key==='pv'?originalCalcPvMax(state):(key==='pe'?originalCalcPeMax(state):originalCalcSanMax(state));
    const curr=Number(state[key]??maxVal);
    const next=Math.max(0,Math.min(maxVal,curr+delta));
    state[key]=next;
    playResourceSound(delta>0);
    save(false);

    const card=btn.closest('.original-resource-card');
    if(card){
     const inp=card.querySelector('.res-input-current');
     if(inp) inp.value=next;
     const fill=card.querySelector('.res-fill');
     if(fill&&maxVal>0) fill.style.width=`${(next/maxVal)*100}%`;
     const animClass=delta<0?'res-flash-damage':'res-flash-heal';
     card.classList.remove('res-flash-damage','res-flash-heal');
     void card.offsetWidth;
     card.classList.add(animClass);
     setTimeout(()=>card.classList.remove(animClass),400);
     return;
    }

    const cinItem=btn.closest('.cinematic-resource-item');
    if(cinItem){
     const bold=cinItem.querySelector('b');
     if(bold&&bold.childNodes.length>0){
      bold.childNodes[0].nodeValue=String(next);
     }
     const fill=cinItem.querySelector('.cin-progress-track i');
     if(fill&&maxVal>0) fill.style.width=`${(next/maxVal)*100}%`;
     const animClass=delta<0?'res-flash-damage':'res-flash-heal';
     cinItem.classList.remove('res-flash-damage','res-flash-heal');
     void cinItem.offsetWidth;
     cinItem.classList.add(animClass);
     setTimeout(()=>cinItem.classList.remove(animClass),400);
     return;
    }

    render();
   };
  });
  document.querySelectorAll('[data-remove-paranormal]').forEach(btn=>{
   btn.onclick=()=>{
    const idx=Number(btn.dataset.removeParanormal);
    if(!isNaN(idx)&&state.poderesParanormais){
     state.poderesParanormais.splice(idx,1);
     save(false);
     render();
    }
   };
  });
  document.querySelectorAll('[data-remove-chosen-power]').forEach(btn=>{
   btn.onclick=()=>{
    const idx=Number(btn.dataset.removeChosenPower);
    if(!isNaN(idx)&&state.poderesEscolhidos){
     const [removido]=state.poderesEscolhidos.splice(idx,1);
     if(removido?.nome) reverterTreinoDePoder(state,removido.nome);
     save(false);
     render();
    }
   };
  });
  document.querySelectorAll('[data-remove-ritual]').forEach(btn=>{
   btn.onclick=()=>{
    const rId=btn.dataset.removeRitual;
    if(rId&&state.rituaisConhecidos){
     state.rituaisConhecidos=state.rituaisConhecidos.filter(id=>id!==rId);
     save(false);
     render();
    }
   };
  });
  document.querySelectorAll('[data-cast-ritual]').forEach(btn=>{
   btn.onclick=(e)=>{
    e.stopPropagation();
    castRitual(btn.dataset.castRitual);
   };
  });
  const btnAddAttack=document.querySelector('#btn-add-attack');
  if(btnAddAttack){
   btnAddAttack.onclick=()=>{
    if(!Array.isArray(state.ataques)) state.ataques=[];
    state.ataques.push({
     nome:'Nova Arma',
     ataque:'3d20+5',
     dano:'1d8',
     critico:'20/x2',
     alcance:'Curto',
     tipo:'Balístico'
    });
    save(false);
    render();
   };
  }
  document.querySelectorAll('[data-remove-attack]').forEach(btn=>{
   btn.onclick=()=>{
    const idx=Number(btn.dataset.removeAttack);
    if(!isNaN(idx)&&state.ataques){
     state.ataques.splice(idx,1);
     save(false);
     render();
    }
   };
  });
  document.querySelectorAll('[data-attack-field]').forEach(inp=>{
   inp.onchange=()=>{
    const[idxStr,field]=inp.dataset.attackField.split(':');
    const idx=Number(idxStr);
    if(!isNaN(idx)&&state.ataques?.[idx]&&field){
     state.ataques[idx][field]=inp.value;
     save(false);
    }
   };
  });
  document.querySelectorAll('[data-roll-attack]').forEach(btn=>{
   btn.onclick=(e)=>{
    e.stopPropagation();
    rollOriginalAttack(Number(btn.dataset.rollAttack));
   };
  });
  document.querySelectorAll('[data-roll-damage]').forEach(btn=>{
   btn.onclick=(e)=>{
    e.stopPropagation();
    rollOriginalDamage(Number(btn.dataset.rollDamage));
   };
  });
  const btnAddInv=document.querySelector('#btn-add-inventory-item');
  if(btnAddInv){
   btnAddInv.onclick=()=>{
    if(!Array.isArray(state.inventario)) state.inventario=[];
    state.inventario.push({
     nome:'Novo Item',
     espaco:1,
     categoria:'0',
     qtd:1,
     descricao:''
    });
    save(false);
    render();
   };
  }
  document.querySelectorAll('[data-remove-inventory]').forEach(btn=>{
   btn.onclick=()=>{
    const idx=Number(btn.dataset.removeInventory);
    if(!isNaN(idx)&&state.inventario){
     state.inventario.splice(idx,1);
     save(false);
     render();
    }
   };
  });
  document.querySelectorAll('[data-inv-field]').forEach(inp=>{
   inp.onchange=()=>{
    const[idxStr,field]=inp.dataset.invField.split(':');
    const idx=Number(idxStr);
    if(!isNaN(idx)&&state.inventario?.[idx]&&field){
     if(field==='espaco'||field==='qtd'){
      state.inventario[idx][field]=Number(inp.value)||0;
     }else{
      state.inventario[idx][field]=inp.value;
     }
     save(false);
     render();
    }
   };
  });
  document.querySelectorAll('[data-original-field]').forEach(el=>{
   el.onchange=e=>{
    if(presentationMode){notifyPresentationLocked();return;}
    const key=e.target.dataset.originalField;
    const classeAnterior=state.classeId;
    if(key==='nex'){
     mudarNexOriginal(()=>{state.nex=snapNex(e.target.value);ajustarNexDaClasse(state);});
    }else if(key==='estagio'){
     mudarNexOriginal(()=>{state.nex=nexDoEstagio(e.target.value);});
    }else if(key==='classeId'){
     const novaClasse=e.target.value;
     sincronizarAoMudarNex(state,()=>{
      aplicarTransicaoDeClasse(state,classeAnterior,novaClasse);
      state.classeId=novaClasse;
      const cls=classeAtual(state);
      state.trilhaId=cls.trilhas?.[0]?.id||'';
      state.trilhaSecundariaId='';
      state.trilhaTerciariaId='';
      ajustarNexDaClasse(state);
     });
    }else if(['defesaOutros','pvTemp','peTemp','sanTemp'].includes(key)){
     state[key]=Number(e.target.value)||0;
    }else{
     state[key]=e.target.value;
    }
    if(key==='trilhaId'){
     if(state.trilhaSecundariaId===state.trilhaId) state.trilhaSecundariaId='';
     if(state.trilhaTerciariaId===state.trilhaId) state.trilhaTerciariaId='';
     solicitarPromptProgressao(state.id);
    }
    if(key==='origemId'){
     solicitarPromptProgressao(state.id);
    }
    if(key==='nivelTrilhaTerciaria') state.nivelTrilhaTerciaria=Number(e.target.value)||1;
    save(false);
    render();
   };
  });
  document.querySelectorAll('[data-toggle-pd]').forEach(btn=>{
   btn.onclick=()=>{
    if(presentationMode){notifyPresentationLocked();return;}
    definirRegraDeRecursos(state,!state.usaPD);
    save(false);
    render();
   };
  });
  document.querySelectorAll('[data-aumento-atributo]').forEach(el=>{
   el.onchange=e=>{
    if(presentationMode){notifyPresentationLocked();return;}
    sincronizarAoMudarNex(state,()=>{
     definirAumentoAtributo(state,e.target.dataset.aumentoAtributo,e.target.value);
    });
    save(false);
    render();
   };
  });
  const progCtx={
   getSheet:()=>state,
   isLocked:()=>presentationMode,
   saveAndRender:()=>{save(false);render();},
   openCompendium:opts=>openOriginalCompendium(opts),
   onOpenTrilhaInicial:()=>{promptTrilhaInicial=state.id;promptTrilhaFoco=null;syncPromptDeTrilha();},
   onOpenVersatilidade:()=>{promptTrilhaAdiado=null;syncPromptDeTrilha();},
  };
  syncPromptDeTrilha();
  bindEventosProgressaoOriginal(progCtx);
 // ── Mobile bottom nav ──────────────────────────────────────────────────────
 document.querySelectorAll('[data-mobile-tab]').forEach(el=>el.onclick=()=>{mobileTab=el.dataset.mobileTab;render()});
 document.querySelectorAll('[data-cinematic-mobile-tab]').forEach(el=>el.onclick=()=>{cinematicMobileTab=el.dataset.cinematicMobileTab;render()});
 document.querySelectorAll('[data-sheet-drawer]').forEach(el=>el.onclick=()=>{sheetDrawerOpen=!sheetDrawerOpen;render()});
 document.querySelectorAll('[data-close-drawer]').forEach(el=>el.onclick=()=>{sheetDrawerOpen=false;render()});
 // ── Histórico de rolagens ──────────────────────────────────────────────────
 document.querySelectorAll('[data-open-roll-log]').forEach(el=>el.onclick=()=>toggleRollLog(true));
 document.querySelectorAll('[data-close-roll-log]').forEach(el=>el.onclick=()=>toggleRollLog(false));
 document.querySelectorAll('[data-clear-roll-log]').forEach(el=>el.onclick=()=>{
  rollLog=[];
  try{sessionStorage.removeItem('ordem-ii-roll-log')}catch{}
  updateRollLogUi();
  const toast=document.querySelector('#save-toast');
  if(toast){toast.textContent='HISTÓRICO LIMPO';toast.classList.add('show');setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},1300)}
  render();
 });
 document.querySelectorAll('[data-copy-all-rolls]').forEach(el=>el.onclick=()=>{
  if(!rollLog.length)return;
  const text='🎲 **Histórico de Rolagens (Ordem Paranormal II)**\n'+rollLog.map(r=>{
   const modStr=r.modifier?` ${r.modifier>0?'+':'−'} ${Math.abs(r.modifier)}`:'';
   const diceStr=(r.dice||[]).map(d=>`d${d.sides}:${d.value}`).join(', ');
   return `• [${r.timestamp}] **${r.characterName}** | ${r.title}: **${r.total}** (${diceStr}${modStr})`;
  }).join('\n');
  navigator.clipboard.writeText(text).catch(()=>{});
  const toast=document.querySelector('#save-toast');
  if(toast){toast.textContent='HISTÓRICO COMPLETO COPIADO!';toast.classList.add('show');setTimeout(()=>{toast.classList.remove('show');toast.textContent='SALVO'},1500)}
 });
 bindRollLogItemEvents();
}
document.addEventListener('click',e=>{closeSheetContextMenu();closeFolderContextMenu();if(!viewSwitchCollapsed&&!e.target.closest('.view-mode-switch')){viewSwitchCollapsed=true;const sw=document.querySelector('.view-mode-switch');if(sw){sw.className='view-mode-switch collapsed';sw.innerHTML=`<button type="button" class="view-mode-trigger" data-toggle-view-switch title="Alternar modo de exibição (Clique para expandir)">${state.viewMode==='vigilia'?icon('shield',14):(state.viewMode==='cinematic'?icon('film',14):icon('grid',14))}<span>${state.viewMode==='vigilia'?'VIGÍLIA':(state.viewMode==='cinematic'?'CINEMA':'PADRÃO')}</span><i class="switch-arrow">▾</i></button>`;const trig=sw.querySelector('[data-toggle-view-switch]');if(trig)trig.onclick=ev=>{ev.stopPropagation();viewSwitchCollapsed=!viewSwitchCollapsed;render()}}}});

document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&(e.key==='k'||e.key==='K')){
  e.preventDefault();
  quickSwitcherOpen=!quickSwitcherOpen;
  quickSwitcherQuery='';
  quickSwitcherIndex=0;
  render();
  if(quickSwitcherOpen){
   setTimeout(()=>document.querySelector('[data-qs-input]')?.focus(),25);
  }
  return;
 }

 if(quickSwitcherOpen){
  if(e.key==='Escape'){
   e.preventDefault();
   quickSwitcherOpen=false;
   render();
   return;
  }
  const items=Array.from(document.querySelectorAll('.quick-switcher-item'));
  if(e.key==='ArrowDown'){
   e.preventDefault();
   if(items.length>0){
    quickSwitcherIndex=(quickSwitcherIndex+1)%items.length;
    items.forEach((it,idx)=>it.classList.toggle('selected',idx===quickSwitcherIndex));
    items[quickSwitcherIndex]?.scrollIntoView({block:'nearest'});
   }
   return;
  }
  if(e.key==='ArrowUp'){
   e.preventDefault();
   if(items.length>0){
    quickSwitcherIndex=(quickSwitcherIndex-1+items.length)%items.length;
    items.forEach((it,idx)=>it.classList.toggle('selected',idx===quickSwitcherIndex));
    items[quickSwitcherIndex]?.scrollIntoView({block:'nearest'});
   }
   return;
  }
  if(e.key==='Enter'){
   e.preventDefault();
   const selectedItem=items[quickSwitcherIndex]||items[0];
   if(selectedItem?.dataset?.qsSheetId){
    quickSwitcherOpen=false;
    switchToSheet(selectedItem.dataset.qsSheetId);
   }
   return;
  }
 }

 if(presentationMode){
  if(e.key==='Escape'){closePresentationMode();return;}
  if(e.key==='ArrowLeft'){cyclePresentation(-1);return;}
  if(e.key==='ArrowRight'){cyclePresentation(1);return;}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();const pres=getPresentationSheets();confirmPresentationAgent(pres[presentationIndex]||pres[0]);return;}
  return;
 }
 if(e.key==='Escape'){
  closeSheetContextMenu();
  closeFolderContextMenu();
  if(sidebarNavigatorOpen&&!sidebarNavigatorPinned){
   sidebarNavigatorOpen=false;
   appSettings.sidebarNavigatorOpen=false;
   saveAppSettings();
   render();
   return;
  }
  closeSlotModal();
  closeCardEditor();
  closeSkillInfo();
  toggleRollLog(false);
  document.querySelector('#critical-settings-modal')?.classList.remove('open');
  const m=document.querySelector('#system-select-modal');
  if(m)m.style.display='none';
  const bUnlock=document.querySelector('#bestiary-unlock-modal');
  if(bUnlock)bUnlock.style.display='none';
  const bManage=document.querySelector('#bestiary-manage-modal');
  if(bManage)bManage.style.display='none';
  document.querySelectorAll('.threat-modal').forEach(modal=>modal.style.display='none');
 }
 if((e.key==='h'||e.key==='H')&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){toggleRollLog()}
});

let resizeRaf=0;
window.addEventListener('resize',()=>{
 closeSheetContextMenu();
 closeFolderContextMenu();
 if(resizeRaf)cancelAnimationFrame(resizeRaf);
 resizeRaf=requestAnimationFrame(()=>{
  resizeRaf=0;
  syncMobilePresentationViewport();
  syncCinematicLineMask();
  syncCriticalAtmosphere();
 });
},{passive:true});
window.visualViewport?.addEventListener('resize',syncMobilePresentationViewport,{passive:true});
screen.orientation?.addEventListener?.('change',syncMobilePresentationViewport);
document.addEventListener('touchmove',event=>{if(document.body.classList.contains('mobile-cinematic-landscape')&&event.touches.length>1)event.preventDefault()},{passive:false});
document.addEventListener('gesturestart',event=>{if(document.body.classList.contains('mobile-cinematic'))event.preventDefault()},{passive:false});
document.addEventListener('visibilitychange',syncCriticalAtmosphere);
document.addEventListener('pointerdown',()=>{const context=getUiAudioContext();if(context?.state==='running')syncCriticalAtmosphere();else context?.resume?.().then(syncCriticalAtmosphere).catch(()=>{})},{once:true,capture:true});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{}),{once:true});
await loadInitialSheets();
if (state.systemMode === 'threat') {
 presentationMode = false;
 state.viewMode = 'livro';
} else {
 if (state.viewMode !== 'vigilia') {
  state.viewMode = 'cinematic';
 }
 presentationMode = true;
 const presSheets = getPresentationSheets();
 presentationIndex = Math.max(0, presSheets.findIndex(sheet => sheet.id === state.id));
 state = presSheets[presentationIndex] || state;
}
activeSheetId = state.id;
initOriginalCompendium({
 getSheet:()=>state,
 isOriginal:()=>state.systemMode==='original',
 isLocked:()=>presentationMode,
 onChange:()=>{save(false);render();},
 onNeedChoice:nomePoder=>abrirModalProgressao(`sub_escolha:${nomePoder}`,{
  getSheet:()=>state,
  isLocked:()=>presentationMode,
  saveAndRender:()=>{save(false);render();},
 }),
});
render();
