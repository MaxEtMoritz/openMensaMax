---
layout: post
title: "Parser Update: Metadata"
date: 2025-12-18 15:00:00 +0100
---

I recently found out that MensaMax provides an imprint page for every canteen with the institution name, address, e-mail, phone number and website (if the provider filled out those details).

This smelled like a very good candidate for automatic parsing, which i have done now.

Now, not the hard-coded information from the JSON file, but the actual name and location supplied by the canteen are submitted to OpenMensa.

As always, not every provider fills this metadata out in a reasonable way (since it's captioned as "the responsible entity for the content", sometimes the information of the caterer or the responsible persons at the municipality are provided instead of the name or address of the school), but something is always better than nothing, isn't it?