import Mustache from "./libs/mustache.js";
// import dayjs from 'dayjs' // ES 2015

import { restoreTabs, clickSaveTabs }  from "./shared.js";


async function renderHello(sessionData) {
  const template = document.getElementById('template').innerHTML;
  const rendered = Mustache.render(template, { sessions: sessionData });
  document.getElementById('target').innerHTML = rendered;
  addHandlers();
}

document.addEventListener("DOMContentLoaded", async (event) => {

  dayjs.extend(window.dayjs_plugin_relativeTime)
  document.querySelector("#save-session-btn")
    .addEventListener('click', (event) => {
      clickSaveTabs();
  });

  var autoSavesData = await getStoredTabs("auto");
  var manualSavesData = await getStoredTabs("manual");

  console.log({manualSavesData})

  const template = document.getElementById('template').innerHTML;
  const autoSavesRendered = Mustache.render(template, { sessions: autoSavesData });

  const manualSavesRendered = Mustache.render(template, { sessions: manualSavesData });

  document.getElementById('auto-saves').innerHTML = autoSavesRendered;
  document.getElementById('manual-saves').innerHTML = manualSavesRendered;
  await addHandlers();
});

async function getStoredTabs(type) {
  const storeKey = `tabs_${type}`
  const storedTabs = await chrome.storage.local.get([storeKey]);
  const tabs = storedTabs[storeKey];

  console.debug({storedTabs});

  // const procData = [];
  const sessionData = [];
  for (const t in tabs) {
    const session = tabs[t];
    const winTabsData = [];
    let i = 1;
    for (const win in session) {
      const winTabs = session[win];
      winTabsData.push({window: i++, win_tabs: session[win]})
    }
    sessionData.push({type: type, timestamp: t, displayTimestamp: dayjs(parseInt(t)).fromNow(), windows:  winTabsData})
  }

  sessionData.reverse();
  return sessionData
}

async function addHandlers() {
  const buttons = document.querySelectorAll(".restore-sesh-btn");
  console.log("wof");
  console.log({buttons});
  buttons.forEach ( b => {
    b.addEventListener('click', async (event) => {
      const winIds = await getCurrentWins();
      console.log(event.target.getAttribute("timestamp"));
      const type = event.target.getAttribute("type");
      console.log({type})
      // const currentTabs = await tabDump();
      const currentTabs = {};
      const storeKey = `tabs_${type}`;
      const storedTabs = await chrome.storage.local.get([storeKey]);
      const tabsToRestore = storedTabs[storeKey][event.target.getAttribute("timestamp")]
      await restoreTabs(tabsToRestore, currentTabs);
      closeWindows(winIds);
    });
  });

  const window_titles = document.querySelectorAll(".windows-title");

  window_titles.forEach ( w => {
    w.addEventListener('click', async (event) => {
    console.log('clickeed');
      console.log(w);
      console.log(w.parentNode);
      w.parentNode.querySelector(".tab-list").classList.toggle('hide');
    });
  });

  const timestamp_titles = document.querySelectorAll(".timestamp-title");

  timestamp_titles.forEach ( w => {
    w.addEventListener('click', async (event) => {
      w.parentNode.querySelectorAll(".tab-list").forEach( t => {

        t.classList.toggle('hide');
      });

    });
  });
}

async function getCurrentWins() {
  const wins = await chrome.windows.getAll();
  const winIds = wins.map(x => x.id);
  return winIds
}

async function closeWindows(winIds) {
  console.log('closing', winIds);
  for (const w in winIds) {
    await chrome.windows.remove(winIds[w]);
  }
}

