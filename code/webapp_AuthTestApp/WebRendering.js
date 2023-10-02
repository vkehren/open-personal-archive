import {isNullish} from "./WebBaseLite.js";

const NAME = "open-personal-archive-web-rendering";
const VERSION = "2.3.3";
const AUTHOR = "Ryan Stephen Ehrenreich";
const COPYRIGHT = "Copyright © 2021 Open Personal Archive™";
const BUILD_DATE = "2023-10-02T09:40:21.822Z";

const DEFAULT_REFRESH_WAIT_IN_MS = 1; // refresh on next tick
function refreshPageOnTimeout(refreshWaitInMs = DEFAULT_REFRESH_WAIT_IN_MS) {
  const timeoutId = setTimeout(function() {
    window.location.reload();
  }, refreshWaitInMs);
  return timeoutId;
}

const DEFAULT_INACTIVITY_WAIT_IN_MS = (10 * 60000); // refresh in 10 minutes
function schedulePageRefreshForInactivity(inactivityWaitInMs = DEFAULT_INACTIVITY_WAIT_IN_MS) {
  let inactivityTimeoutId = refreshPageOnTimeout(inactivityWaitInMs);

  document.onkeydown = function(event) {
    clearTimeout(inactivityTimeoutId);
    inactivityTimeoutId = refreshPageOnTimeout(inactivityWaitInMs);
  };
  document.onmousemove = function(event) {
    clearTimeout(inactivityTimeoutId);
    inactivityTimeoutId = refreshPageOnTimeout(inactivityWaitInMs);
  };
  document.ontouchmove = function(event) {
    clearTimeout(inactivityTimeoutId);
    inactivityTimeoutId = refreshPageOnTimeout(inactivityWaitInMs);
  };
}

export {refreshPageOnTimeout, schedulePageRefreshForInactivity};
