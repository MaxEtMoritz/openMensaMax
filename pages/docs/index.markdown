---
layout: home
permalink: /
title: Home
order: 1
---
# OpenMensaMax
[![🔁 RunParsers](https://github.com/MaxEtMoritz/openMensaMax/actions/workflows/updateFeed.yml/badge.svg)](https://github.com/MaxEtMoritz/openMensaMax/actions/workflows/updateFeed.yml)

This is the page of the OpenMensaMax project.

The project goal is to create a [OpenMensa](https://openmensa.org) parser for the canteen system [MensaMax](https://mensamax.de/).

## How does this work?
The parser is written in JavaScript and executed via NodeJS in a GitHub action.
It makes a web request to the MensaMax servers and fetches the weekly meal plans for all canteens that are known to use MensaMax.