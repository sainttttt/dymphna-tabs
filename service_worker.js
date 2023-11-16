'use strict';

import { autoSaveTabs }  from "./shared.js";

chrome.alarms.onAlarm.addListener(() => {
  console.log("saved tabs");
  autoSaveTabs();
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  // if (reason !== 'install') {
  //   return;
  // }

  // Create an alarm so we have something to look at in the demo
  await chrome.alarms.create('demo-default-alarm', {
    delayInMinutes: 1,
    periodInMinutes:10,
  });
});

chrome.tabs.onCreated.addListener(async (tab) => {
  console.log("Created Tab");
  console.log({tab});
  if (tab.pendingUrl == "chrome://newtab/") {
    chrome.tabs.move(
      tab.id,
      {index: -1 }
    )
  } else {
    console.log("not blank url");
    const openerTab = await chrome.tabs.get(tab.openerTabId)
    chrome.tabs.move(
      tab.id,
      {index: openerTab.index + 1 }
    )
  }
})
