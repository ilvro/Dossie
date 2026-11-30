import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFolders, createFolder, updateFolder, folderViewMode, applyFolderViewMode } from '../src/workspace/folders.js';

function cenario() {
  const pai = createFolder([], { name: 'Pai', viewMode: 'solace' });
  const filha = createFolder(pai.folders, { name: 'Filha', parentId: pai.folder.id });
  return { folders: filha.folders, pai: pai.folder.id, filha: filha.folder.id };
}

test('o modo da pasta sobrevive à normalização e a subpasta herda', () => {
  const { folders, pai, filha } = cenario();
  assert.equal(folderViewMode(normalizeFolders(folders), filha), 'solace');
  const trocada = updateFolder(folders, filha, { viewMode: 'vigilia' });
  assert.equal(folderViewMode(trocada, filha), 'vigilia');
  assert.equal(folderViewMode(trocada, pai), 'solace');
  assert.equal(folderViewMode(updateFolder(folders, pai, { viewMode: null }), filha), null);
});

test('o modo vale para agentes, respeita os limites de Ordem RPG e ignora ameaças', () => {
  const { folders, pai } = cenario();
  const agente = { systemMode: 'ordem2', folderId: pai, viewMode: 'traditional' };
  assert.equal(applyFolderViewMode(folders, agente), true);
  assert.equal(agente.viewMode, 'solace');
  const original = { systemMode: 'original', folderId: pai, viewMode: 'cinematic' };
  assert.equal(applyFolderViewMode(folders, original), false);
  const ameaca = { systemMode: 'threat', folderId: pai, viewMode: 'livro' };
  assert.equal(applyFolderViewMode(folders, ameaca), false);
});
