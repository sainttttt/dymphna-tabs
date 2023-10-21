import Mustache from "./mustache.js";

async function tabDump() {
  const tabs = await chrome.tabs.query({});
  let tabDump = {};

  for (const tab of tabs) {
    if (!(tab.windowId in tabDump)) {
      tabDump[tab.windowId] = [];
    }
    tabDump[tab.windowId].push(tab);
  }
  console.debug({tabDump});
  return tabDump
}

async function saveTabs(tabs) {
  const curTime = new Date().getTime();

  const store = await chrome.storage.local.get(["tabs"]);
  var tabStore = {};
  if (store.tabs) {
    tabStore = store.tabs;
  }

  tabStore[curTime] = tabs

  await chrome.storage.local.set({ tabs: tabStore })
  console.debug('saved tabs');
}

async function restoreTabs(storedTabs, currentTabs) {

  let restores = Object.keys(storedTabs).sort()
  const lastRestoreTime = restores.slice(-1);
  console.debug(lastRestoreTime);

  const lastRestore = storedTabs[lastRestoreTime];
  console.debug("last restore");
  console.debug(lastRestore);

  const diffByRestoreWindow = {}
  const diffByCurrentWindow = {}
  const allDiffs = []
  const allRestoreWindows = new Set();

  for (const windowId in lastRestore) {
    allRestoreWindows.add(windowId);
    const restoreTab = lastRestore[windowId].map((x) => x.url );

    // await chrome.windows.create(
    //   {
    //     url: tabs
    //   })

    for (const w in currentTabs) {
      // if (currentTabs[w].removed) {
      //   console.debug('continuing')
      //   continue
      // }
      const currentTab = currentTabs[w].map((x) => x.url );

//       console.debug('restore tab');
//       console.debug(restoreTab);

//       console.debug('current tab');
//       console.debug(currentTab);

      console.debug("diff");
      const diffSameTabsRes = diffSameTabs(restoreTab, currentTab);
      console.debug(diffSameTabsRes);
      const diffTabs = diffSameTabsRes[0]
      const sameTabs = diffSameTabsRes[1]
      const diffTabsCount = diffTabs.length;
      const sameTabsCount = sameTabs.length;

      if (diffTabsCount == 0) {
        allRestoreWindows.delete(windowId)
        // currentTabs[w].removed = true;
      } else {

        var diff = {diffCount: diffTabsCount, 
          sameCount: sameTabsCount,
          diffTabsUrls: diffTabs, 
          restoreWindow: windowId, 
          currentWindow: w, 
          removed: false}

        allDiffs.push(diff)
        if (!(windowId in diffByRestoreWindow)) {
          diffByRestoreWindow[windowId] = [];
        }

        if (!(w in diffByCurrentWindow)) {
          diffByCurrentWindow[w] = [];
        }
        diffByCurrentWindow[w].push(diff);
        diffByRestoreWindow[windowId].push(diff);
      }
    }
  }

  console.debug('diffByCurrentWindow');
  console.debug(diffByCurrentWindow);
  console.debug('diffByRestoreWindow');
  console.debug(diffByRestoreWindow);
  allDiffs.sort((a,b)=> a.diffCount - b.diffCount );
  allDiffs.reverse()
  console.debug('allDiffs sorted here');
  console.debug(JSON.parse(JSON.stringify(allDiffs)));

  while(allDiffs) {
    const a = allDiffs.pop();
    console.debug('popped')
    if (!a) break;
    if (a.removed) {
      console.debug("deleted - do not proc")
    } else { 

      console.debug('proc')
      allRestoreWindows.delete(a.restoreWindow);
      for (const i in a.diffTabsUrls) {
        console.debug('difftabsurl open');
        console.debug(a.diffTabsUrls[i]);

        await chrome.tabs.create( {
          active: false,
          selected: false,
          windowId: parseInt(a.currentWindow),
          url: a.diffTabsUrls[i]
        });

      }
    }
    console.debug(a);


    diffByRestoreWindow[a.restoreWindow].forEach((x) => {
      x.removed = true;
    });

    diffByCurrentWindow[a.currentWindow].forEach((x) => {
      x.removed = true;
    });
  }

  console.debug('remaining windows');
  console.debug(allRestoreWindows);


  const allRestoreWindowsArray = Array.from(allRestoreWindows); 

  for (const i in allRestoreWindowsArray) {
   
    const tabs = lastRestore[allRestoreWindowsArray[i]].map((x) => x.url );
    console.debug(tabs);

    await chrome.windows.create(
      {
        url: tabs
      })

  }
  // for (i in allRestoreWindows) {
  //   const w = allRestoreWindows[i];
  //   console.debug(storedTabs[w]);
  // }

}

function arrayToSet(a) {
  const s = new Set();
  for (const t in a) {
    s.add(a[t])
  }
  return s
}

function diffSameTabs(a, b) {
  const aSet = arrayToSet(a);
  const bSet = arrayToSet(b);
  const diff = []
  const same = []

  aSet.forEach((k,v) => {
    if (!bSet.has(v)) {
      diff.push(v)
    } else {
      same.push(v)
    }
  });
  return [diff, same];
}


async function clickSaveTabs() {
  const currentTabs = await tabDump();
  saveTabs(currentTabs);
}

function click2() {

}

async function renderHello(sessionData) {
  const storedTabs = await chrome.storage.local.get(["tabs"]);
  const tabs = storedTabs.tabs

  const template = document.getElementById('template').innerHTML;

  const rendered = Mustache.render(template, { sessions: sessionData });
  document.getElementById('target').innerHTML = rendered;
}

document.querySelector("#save-session-btn")
  .addEventListener('click', (event) => {

    clickSaveTabs();
    // renderHello();
});


const storedTabs = await chrome.storage.local.get(["tabs"]);
const tabs = storedTabs.tabs;
console.debug({storedTabs});


// const procData = [];
const sessionData = [];
for (const t in tabs) {
  const session = tabs[t];

  const winTabsData = [];
  for (const win in session) {
    const winTabs = session[win];
    winTabsData.push({window: win, win_tabs: session[win]})
  }
  sessionData.push({timestamp: t, windows:  winTabsData})
}

console.log({sessionData});

renderHello(sessionData);


// document.querySelector("#saved-sessions").innerHTML = `<p>${JSON.stringify(storedTabs.tabs)}</p>`


// await restoreTabs(storedTabs.tabs, currentTabs);

