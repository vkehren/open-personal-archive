const NAME = "open-personal-archive-time-zone-groups";
const VERSION = "2.4.3";
const AUTHOR = "Ryan Stephen Ehrenreich";
const COPYRIGHT = "Copyright © 2021 Open Personal Archive™";

const supportedTimeZoneGroups = [
  {
    "id": "OPA_TimeZoneGroup_LINT_+14:00",
    "name": "Line Islands Time",
    "abbreviation": "LINT",
    "utcOffset": "+14:00",
    "primaryTimeZoneId": "OPA_TimeZone_Pacific_Kiritimati",
    "primaryTimeZoneName": "Pacific/Kiritimati",
    "displayOrder": 100,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_TOT_+13:00",
    "name": "Tonga Time",
    "abbreviation": "TOT",
    "utcOffset": "+13:00",
    "primaryTimeZoneId": "OPA_TimeZone_Pacific_Tongatapu",
    "primaryTimeZoneName": "Pacific/Tongatapu",
    "displayOrder": 200,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_CHAST_+12:45",
    "name": "Chatham Island Standard Time",
    "abbreviation": "CHAST",
    "utcOffset": "+12:45",
    "primaryTimeZoneId": "OPA_TimeZone_Pacific_Chatham",
    "primaryTimeZoneName": "Pacific/Chatham",
    "displayOrder": 300,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_NZST_+12:00",
    "name": "New Zealand Standard Time",
    "abbreviation": "NZST",
    "utcOffset": "+12:00",
    "primaryTimeZoneId": "OPA_TimeZone_Pacific_Auckland",
    "primaryTimeZoneName": "Pacific/Auckland",
    "displayOrder": 400,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_BST_+11:00",
    "name": "Bougainville Standard Time",
    "abbreviation": "BST",
    "utcOffset": "+11:00",
    "primaryTimeZoneId": "OPA_TimeZone_Pacific_Bougainville",
    "primaryTimeZoneName": "Pacific/Bougainville",
    "displayOrder": 500,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_LHST_+10:30",
    "name": "Lord Howe Standard Time",
    "abbreviation": "LHST",
    "utcOffset": "+10:30",
    "primaryTimeZoneId": "OPA_TimeZone_Australia_Lord_Howe",
    "primaryTimeZoneName": "Australia/Lord_Howe",
    "displayOrder": 600,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_AEST_+10:00",
    "name": "Australian Eastern Standard Time",
    "abbreviation": "AEST",
    "utcOffset": "+10:00",
    "primaryTimeZoneId": "OPA_TimeZone_Australia_Brisbane",
    "primaryTimeZoneName": "Australia/Brisbane",
    "displayOrder": 700,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_ACST_+09:30",
    "name": "Australian Central Standard Time",
    "abbreviation": "ACST",
    "utcOffset": "+09:30",
    "primaryTimeZoneId": "OPA_TimeZone_Australia_Darwin",
    "primaryTimeZoneName": "Australia/Darwin",
    "displayOrder": 800,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_KST_+09:00",
    "name": "Korea Standard Time",
    "abbreviation": "KST",
    "utcOffset": "+09:00",
    "primaryTimeZoneId": "OPA_TimeZone_Asia_Seoul",
    "primaryTimeZoneName": "Asia/Seoul",
    "displayOrder": 900,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_JST_+09:00",
    "name": "Japan Standard Time",
    "abbreviation": "JST",
    "utcOffset": "+09:00",
    "primaryTimeZoneId": "OPA_TimeZone_Asia_Tokyo",
    "primaryTimeZoneName": "Asia/Tokyo",
    "displayOrder": 1000,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_ACWST_+08:45",
    "name": "Australian Central Western Standard Time",
    "abbreviation": "ACWST",
    "utcOffset": "+08:45",
    "primaryTimeZoneId": "OPA_TimeZone_Australia_Eucla",
    "primaryTimeZoneName": "Australia/Eucla",
    "displayOrder": 1100,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_CST_+08:00",
    "name": "China Standard Time",
    "abbreviation": "CST",
    "utcOffset": "+08:00",
    "primaryTimeZoneId": "OPA_TimeZone_Asia_Shanghai",
    "primaryTimeZoneName": "Asia/Shanghai",
    "displayOrder": 1200,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_WITA_+08:00",
    "name": "Central Indonesian Time",
    "abbreviation": "WITA",
    "utcOffset": "+08:00",
    "primaryTimeZoneId": "OPA_TimeZone_Asia_Makassar",
    "primaryTimeZoneName": "Asia/Makassar",
    "displayOrder": 1300,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_WIB_+07:00",
    "name": "Western Indonesian Time",
    "abbreviation": "WIB",
    "utcOffset": "+07:00",
    "primaryTimeZoneId": "OPA_TimeZone_Asia_Jakarta",
    "primaryTimeZoneName": "Asia/Jakarta",
    "displayOrder": 1400,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_OMST_+06:00",
    "name": "Omsk Standard Time",
    "abbreviation": "OMST",
    "utcOffset": "+06:00",
    "primaryTimeZoneId": "OPA_TimeZone_Asia_Omsk",
    "primaryTimeZoneName": "Asia/Omsk",
    "displayOrder": 1500,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_NPT_+05:45",
    "name": "Nepal Time",
    "abbreviation": "NPT",
    "utcOffset": "+05:45",
    "primaryTimeZoneId": "OPA_TimeZone_Asia_Kathmandu",
    "primaryTimeZoneName": "Asia/Kathmandu",
    "displayOrder": 1600,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_IST_+05:30",
    "name": "India Standard Time",
    "abbreviation": "IST",
    "utcOffset": "+05:30",
    "primaryTimeZoneId": "OPA_TimeZone_Asia_Kolkata",
    "primaryTimeZoneName": "Asia/Kolkata",
    "displayOrder": 1700,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_PKT_+05:00",
    "name": "Pakistan Standard Time",
    "abbreviation": "PKT",
    "utcOffset": "+05:00",
    "primaryTimeZoneId": "OPA_TimeZone_Asia_Karachi",
    "primaryTimeZoneName": "Asia/Karachi",
    "displayOrder": 1800,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_AFT_+04:30",
    "name": "Afghanistan Time",
    "abbreviation": "AFT",
    "utcOffset": "+04:30",
    "primaryTimeZoneId": "OPA_TimeZone_Asia_Kabul",
    "primaryTimeZoneName": "Asia/Kabul",
    "displayOrder": 1900,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_GET_+04:00",
    "name": "Georgia Standard Time",
    "abbreviation": "GET",
    "utcOffset": "+04:00",
    "primaryTimeZoneId": "OPA_TimeZone_Asia_Tbilisi",
    "primaryTimeZoneName": "Asia/Tbilisi",
    "displayOrder": 2000,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_EAT_+03:00",
    "name": "East Africa Time",
    "abbreviation": "EAT",
    "utcOffset": "+03:00",
    "primaryTimeZoneId": "OPA_TimeZone_Africa_Nairobi",
    "primaryTimeZoneName": "Africa/Nairobi",
    "displayOrder": 2100,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_MSK_+03:00",
    "name": "Moscow Standard Time",
    "abbreviation": "MSK",
    "utcOffset": "+03:00",
    "primaryTimeZoneId": "OPA_TimeZone_Europe_Moscow",
    "primaryTimeZoneName": "Europe/Moscow",
    "displayOrder": 2200,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_EET_+02:00",
    "name": "Eastern European Time",
    "abbreviation": "EET",
    "utcOffset": "+02:00",
    "primaryTimeZoneId": "OPA_TimeZone_Europe_Kaliningrad",
    "primaryTimeZoneName": "Europe/Kaliningrad",
    "displayOrder": 2300,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_CAT_+02:00",
    "name": "Central Africa Time",
    "abbreviation": "CAT",
    "utcOffset": "+02:00",
    "primaryTimeZoneId": "OPA_TimeZone_Africa_Gaborone",
    "primaryTimeZoneName": "Africa/Gaborone",
    "displayOrder": 2400,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_WAT_+01:00",
    "name": "West Africa Time",
    "abbreviation": "WAT",
    "utcOffset": "+01:00",
    "primaryTimeZoneId": "OPA_TimeZone_Africa_Lagos",
    "primaryTimeZoneName": "Africa/Lagos",
    "displayOrder": 2500,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_CET_+01:00",
    "name": "Central European Time",
    "abbreviation": "CET",
    "utcOffset": "+01:00",
    "primaryTimeZoneId": "OPA_TimeZone_Europe_Paris",
    "primaryTimeZoneName": "Europe/Paris",
    "displayOrder": 2600,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_UTC_00:00",
    "name": "Coordinated Universal Time",
    "abbreviation": "UTC",
    "utcOffset": "00:00",
    "primaryTimeZoneId": "OPA_TimeZone_UTC",
    "primaryTimeZoneName": "UTC",
    "displayOrder": 2700,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_WET_00:00",
    "name": "Western European Time",
    "abbreviation": "WET",
    "utcOffset": "00:00",
    "primaryTimeZoneId": "OPA_TimeZone_Europe_London",
    "primaryTimeZoneName": "Europe/London",
    "displayOrder": 2800,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_AZOT_-01:00",
    "name": "Azores Standard Time",
    "abbreviation": "AZOT",
    "utcOffset": "-01:00",
    "primaryTimeZoneId": "OPA_TimeZone_Atlantic_Azores",
    "primaryTimeZoneName": "Atlantic/Azores",
    "displayOrder": 2900,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_FNT_-02:00",
    "name": "Fernando de Noronha Time",
    "abbreviation": "FNT",
    "utcOffset": "-02:00",
    "primaryTimeZoneId": "OPA_TimeZone_America_Noronha",
    "primaryTimeZoneName": "America/Noronha",
    "displayOrder": 3000,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_WGST_-03:00",
    "name": "West Greenland Standard Time",
    "abbreviation": "WGST",
    "utcOffset": "-03:00",
    "primaryTimeZoneId": "OPA_TimeZone_America_Nuuk",
    "primaryTimeZoneName": "America/Nuuk",
    "displayOrder": 3100,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_NST_-03:30",
    "name": "Newfoundland Time",
    "abbreviation": "NST",
    "utcOffset": "-03:30",
    "primaryTimeZoneId": "OPA_TimeZone_America_St_Johns",
    "primaryTimeZoneName": "America/St_Johns",
    "displayOrder": 3200,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_AST_-04:00",
    "name": "Atlantic Standard Time",
    "abbreviation": "AST",
    "utcOffset": "-04:00",
    "primaryTimeZoneId": "OPA_TimeZone_America_Blanc_Sablon",
    "primaryTimeZoneName": "America/Blanc-Sablon",
    "displayOrder": 3300,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_EST_-05:00",
    "name": "Eastern Standard Time",
    "abbreviation": "EST",
    "utcOffset": "-05:00",
    "primaryTimeZoneId": "OPA_TimeZone_America_New_York",
    "primaryTimeZoneName": "America/New_York",
    "displayOrder": 3400,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_CST_-06:00",
    "name": "Central Standard Time",
    "abbreviation": "CST",
    "utcOffset": "-06:00",
    "primaryTimeZoneId": "OPA_TimeZone_America_Chicago",
    "primaryTimeZoneName": "America/Chicago",
    "displayOrder": 3500,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_MST_-07:00",
    "name": "Mountain Standard Time",
    "abbreviation": "MST",
    "utcOffset": "-07:00",
    "primaryTimeZoneId": "OPA_TimeZone_America_Denver",
    "primaryTimeZoneName": "America/Denver",
    "displayOrder": 3600,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_PST_-08:00",
    "name": "Pacific Standard Time",
    "abbreviation": "PST",
    "utcOffset": "-08:00",
    "primaryTimeZoneId": "OPA_TimeZone_America_Los_Angeles",
    "primaryTimeZoneName": "America/Los_Angeles",
    "displayOrder": 3700,
    "isDefault": true
  },
  {
    "id": "OPA_TimeZoneGroup_AKST_-09:00",
    "name": "Alaska Standard Time",
    "abbreviation": "AKST",
    "utcOffset": "-09:00",
    "primaryTimeZoneId": "OPA_TimeZone_America_Juneau",
    "primaryTimeZoneName": "America/Juneau",
    "displayOrder": 3800,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_MART_-09:30",
    "name": "Marquesas Time",
    "abbreviation": "MART",
    "utcOffset": "-09:30",
    "primaryTimeZoneId": "OPA_TimeZone_Pacific_Marquesas",
    "primaryTimeZoneName": "Pacific/Marquesas",
    "displayOrder": 3900,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_HST_-10:00",
    "name": "Hawaii Standard Time",
    "abbreviation": "HST",
    "utcOffset": "-10:00",
    "primaryTimeZoneId": "OPA_TimeZone_Pacific_Honolulu",
    "primaryTimeZoneName": "Pacific/Honolulu",
    "displayOrder": 4000,
    "isDefault": false
  },
  {
    "id": "OPA_TimeZoneGroup_SST_-11:00",
    "name": "Samoa Standard Time",
    "abbreviation": "SST",
    "utcOffset": "-11:00",
    "primaryTimeZoneId": "OPA_TimeZone_Pacific_Apia",
    "primaryTimeZoneName": "Pacific/Apia",
    "displayOrder": 4100,
    "isDefault": false
  }
];

export {supportedTimeZoneGroups};
