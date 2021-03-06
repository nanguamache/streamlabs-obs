// The stress test will not be run when normally running tests.

import { uniqueId, sample } from 'lodash';
import {
  useSpectron,
  focusMain,
  TExecutionContext,
  focusWindow,
  closeWindow,
  test,
} from '../helpers/spectron/index';
import { addScene, clickRemoveScene } from '../helpers/spectron/scenes';
import { addSource, clickRemoveSource, rightClickSource } from '../helpers/spectron/sources';
import { contextMenuClick } from '../helpers/spectron/context-menu';

useSpectron();

const SOURCE_TYPES = [
  'Image',
  'Color Source',
  'Image Slide Show',
  'Browser Source',
  'Media Source',
  'Text (GDI+)',
  'Display Capture',
  'Window Capture',
  'Game Capture',
  'Video Capture Device',
  'Audio Input Capture',
  'Audio Output Capture',
];

type TSourceName = string;

// Utilities

async function getSceneElements(t: TExecutionContext) {
  return (await t.context.app.client.$('.selector-list')).$$('li');
}

async function getSourceElements(t: TExecutionContext) {
  return (await (await t.context.app.client.$('h2=Sources')).$('../..')).$$(
    '.sl-vue-tree-node-item',
  );
}

// Actions

async function addRandomScene(t: TExecutionContext) {
  const name = uniqueId('scene_');

  await focusMain(t);
  await addScene(t, name);
}

async function removeRandomScene(t: TExecutionContext) {
  await focusMain(t);
  const scenes = await getSceneElements(t);

  if (scenes.length > 1) {
    const scene = sample(scenes);
    await await scene.click();
    await clickRemoveScene(t);
  }
}

async function selectRandomScene(t: TExecutionContext) {
  await focusMain(t);
  const scenes = await getSceneElements(t);

  if (scenes.length > 0) {
    const scene = sample(scenes);
    await await scene.click();
  }
}

async function addRandomSource(t: TExecutionContext) {
  const type = sample(SOURCE_TYPES);
  const name = `${type} ${uniqueId()}`;

  console.log('  Source:', name);

  await focusMain(t);
  await addSource(t, type, name);
}

async function removeRandomSource(t: TExecutionContext) {
  await focusMain(t);
  const sources = await getSourceElements(t);

  if (sources.length > 0) {
    const source = sample(sources);
    const text = await source.getText();

    console.log('  Source:', text);

    await source.click();
    await clickRemoveSource(t);
  }
}

async function selectRandomSource(t: TExecutionContext): Promise<TSourceName> {
  await focusMain(t);
  const sources = await getSourceElements(t);

  if (sources.length > 0) {
    const source = sample(sources);
    await source.click();
    const text = await source.getText();

    console.log('  Source:', text);

    return text;
  }

  return '';
}

async function createProjector(t: TExecutionContext) {
  await focusMain(t);
  const sourceName = await selectRandomSource(t);
  if (!sourceName) return;
  await rightClickSource(t, sourceName);
  await contextMenuClick(t, 'Create Source Projector');
}

async function destroyProjector(t: TExecutionContext) {
  if (await focusWindow(t, /windowId=(?!main)(?!child)/)) {
    await closeWindow(t);
  }
  await focusMain(t);
}

async function toggleDayNightMode(t: TExecutionContext) {
  await focusMain(t);
  await (await t.context.app.client.$('button.theme-toggle')).click();
}

async function toggleStudioNode(t: TExecutionContext) {
  await focusMain(t);
  await (await t.context.app.client.$('.icon-studio-mode-3')).click();
}

const ACTION_FUNCTIONS = [
  addRandomScene,
  removeRandomScene,
  selectRandomScene,
  addRandomSource,
  removeRandomSource,
  selectRandomSource,
  createProjector,
  destroyProjector,
  toggleDayNightMode,
  toggleStudioNode,
];

test('Stress test', async (t: TExecutionContext) => {
  let quit = false;

  // Quit after 1 hour
  setTimeout(() => {
    t.pass();
    quit = true;
  }, 60 * 60 * 1000);

  while (!quit) {
    const action = sample(ACTION_FUNCTIONS);
    console.log(action.name);
    await action(t);
  }
});
