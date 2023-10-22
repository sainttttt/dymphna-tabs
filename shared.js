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

async function saveTabs(tabs, type) {
  const curTime = new Date().getTime();

  const storeKey = `tabs_${type}`;

  const store = await chrome.storage.local.get([storeKey]);
  var tabStore = {};
  if (store[storeKey]) {
    tabStore = store[storeKey];
  }

  tabStore[curTime] = tabs

  // get the last timestamps and truncate the rest and store
  let timestamps = Object.keys(tabStore);
  timestamps.sort();
  timestamps = timestamps.slice(-150);

  let tabStoreToSave = {}
  for (const t in timestamps) {
    let timestamp = timestamps[t]
    tabStoreToSave[timestamp] = tabStore[timestamp];
  }
  let tabsObj = {};
  tabsObj[storeKey] = tabStoreToSave;
  await chrome.storage.local.set(tabsObj)
  console.debug('saved tabs');
}

/*
async function diffRestoreTabs(tabsToRestore, currentTabs) {
  // let restores = Object.keys(storedTabs).sort()
  // const tabsToRestoreTime = restores.slice(-1);
  // console.debug(tabsToRestoreTime);

  // const tabsToRestore = storedTabs[tabsToRestoreTime];
  // console.debug("last restore");
  // console.debug(tabsToRestore);



  const diffByRestoreWindow = {}
  const diffByCurrentWindow = {}
  const allDiffs = []
  const allRestoreWindows = new Set();

  for (const windowId in tabsToRestore) {
    allRestoreWindows.add(windowId);
    const restoreTab = tabsToRestore[windowId].map((x) => x.url );

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

    const tabs = tabsToRestore[allRestoreWindowsArray[i]].map((x) => x.url );
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
*/

async function restoreTabs(tabsToRestore, currentTabs) {
  console.log({tabsToRestore});

  for (const windowId in tabsToRestore) {
    const tabs = tabsToRestore[windowId].map((x) => x.url);
    console.debug(tabs);
    await chrome.windows.create(
      {
        url: tabs
      })
  }
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
  console.log('clicking save');
  const currentTabs = await tabDump();
  saveTabs(currentTabs, "manual");
}

async function autoSaveTabs() {
  const currentTabs = await tabDump();
  saveTabs(currentTabs, "auto");
}

export { restoreTabs, clickSaveTabs, autoSaveTabs }
