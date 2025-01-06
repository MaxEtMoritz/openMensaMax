---
layout: home
permalink: /
---

This is the page of the OpenMensaMax project.

The project goal is to create an [OpenMensa](https://openmensa.org) parser for the canteen system [MensaMax](https://mensamax.de/).

## How does this work?
The parser is written in JavaScript and executed via NodeJS in a GitHub action.
It makes a web request to the MensaMax servers and fetches the weekly meal plans for all MensaMax canteens known to the service.

From these plans, it creates XML files in the format that OpenMensa expects, and serves them via GitHub Pages.

## This is cool! How can i help?
You can support the project in the following ways:

- **Make more canteens using MensaMax known to the service**
  If you know a canteen that uses MensaMax, but is not yet listed on the [Available Canteens page](./canteens.markdown), open an issue in GitHub using the `Canteen Addition Request` template, filling out the required information.
- **Help gather information on the known canteens**
  Not all canteens that are registered on the service are registered on OpenMensa yet. This is due to OpenMensa requiring at least the name of the city/village/etc. this canteen is in for it to be shown.

  This information has to be researched on the internet, including any additional information that can be submitted for the canteen, e.g. phone number, e-mail, street address, ...

  Since my time to do this is limited, if you happen to know details for any of the canteens that are missing a registration on OpenMensa, feel free to provide those details to me.