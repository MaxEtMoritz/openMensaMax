---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: page
title: Available Canteens
permalink: /canteens
---
To add these feeds to OpenMensa, open a GitHub issue.
If there should be no response, create a new parser in OpenMensa with the index url [{{ "/feeds/index.json" | absolute_url }}]({{ "/feeds/index.json" | absolute_url }}) to add the feeds.

{% assign canteens = site.data.canteens %}
| Index Key | Name | Project | Institution | Meta Feed | Current Week | Next Weeks | OpenMensa |
|-----------|------|---------|-------------|-----------|--------------|------------|-----------|
{% for canteen in canteens %}{% capture meta_filename %}{{ canteen.p }} {{ canteen.e }}.meta{% endcapture %}{% assign meta = site.static_files | where: "basename", meta_filename %}| {{ canteen.p }}_{{ canteen.e }} | {{ canteen.name }} | {{ canteen.p }} | {{ canteen.e }} | [Meta]({{ "/feeds/" |append: canteen.p |append: ' ' |append: canteen.e |append: '.meta.xml' | relative_url}}) (last updated {{ meta[0].modified_time | date: '%D %R' }}) | [Today]({{ "/feeds/" |append: canteen.p |append: ' ' |append: canteen.e |append: '.today.xml' | relative_url}}) | [Preview]({{ "/feeds/" |append: canteen.p |append: ' ' |append: canteen.e |append: '.xml' | relative_url}}) | {% if canteen.om_id %}[View on OpenMensa](https://openmensa.org/c/{{ canteen.om_id }}){:target="_blank"}{% else %}Not added yet{% endif %} |
{% endfor %} 