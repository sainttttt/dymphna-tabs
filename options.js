import Mustache from "./mustache.js";
// import dayjs from 'dayjs' // ES 2015

import { restoreTabs, clickSaveTabs }  from "./shared.js";


async function renderHello(sessionData) {
  const storedTabs = await chrome.storage.local.get(["tabs"]);
  const tabs = storedTabs.tabs

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

  const storedTabs = await chrome.storage.local.get(["tabs"]);
  const tabs = storedTabs.tabs;
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
    sessionData.push({timestamp: t, displayTimestamp: dayjs(parseInt(t)).fromNow(), windows:  winTabsData})
  }

  sessionData.reverse();
  console.log({sessionData});

  renderHello(sessionData);
});

async function addHandlers() {
  const buttons = document.querySelectorAll(".restore-sesh-btn");
  console.log("wof");
  console.log({buttons});
  buttons.forEach ( b => {
    console.log('button', b);
    b.addEventListener('click', async (event) => {
      const winIds = await getCurrentWins();
      console.log(event.target.getAttribute("timestamp"));
      // const currentTabs = await tabDump();
      const currentTabs = {};
      const storedTabs = await chrome.storage.local.get(["tabs"]);
      const tabsToRestore = storedTabs.tabs[event.target.getAttribute("timestamp")]
      await restoreTabs(tabsToRestore, currentTabs);
      closeWindows(winIds);
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

