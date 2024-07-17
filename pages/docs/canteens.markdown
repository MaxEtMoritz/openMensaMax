---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: page
title: Available Canteens
permalink: /canteens
file_exists: _includes/run.log
order: 2
---
To add these feeds to OpenMensa, open a GitHub issue.
If there should be no response, create a new parser in OpenMensa with the index url [{{ "/feeds/index.json" | absolute_url }}]({{ "/feeds/index.json" | absolute_url }}) to add the feeds.

<details>
    <summary>Log of last parser run</summary>
    {% if file_exists != empty %}{% include run.log %}{% endif %}
</details>

{% assign canteens = site.data.canteens %}
| Index Key | Name | Project | Institution | Meta Feed | Current Week | Next Weeks | OpenMensa |
|-----------|------|---------|-------------|-----------|--------------|------------|-----------|
{% for canteen in canteens %}{% capture preview_filename %}{{ canteen.p }} {{ canteen.e }}{% endcapture %}{% capture meta_filename %}{{ preview_filename }}.meta{% endcapture %}{% capture today_filename %}{{ preview_filename }}.today{% endcapture %}{% assign meta = site.static_files | where: "basename", meta_filename %}{% assign preview = site.static_files | where: "basename", preview_filename %}{% assign today = site.static_files | where: "basename", today_filename %}| {{ canteen.p }}_{{ canteen.e }} | {{ canteen.name }} | {{ canteen.p }} | {{ canteen.e }} | {% if meta.size < 1 %}<span class="error">Unavailable</span>{% else %}[Meta]({{ "/feeds/" |append: meta_filename |append: '.xml' | relative_url}}) (last updated {{ meta[0].modified_time | date: '%D %R' }}){% endif %} | {% if today.size < 1 %}<span class="error">Unavailable</span>{% else %}[Today]({{ "/feeds/" |append: canteen.p |append: ' ' |append: canteen.e |append: '.today.xml' | relative_url}}){% endif %} | {% if preview.size < 1 %}<span class="error">Unavailable</span>{% else %}[Preview]({{ "/feeds/" |append: canteen.p |append: ' ' |append: canteen.e |append: '.xml' | relative_url}}){% endif %} | {% if canteen.om_id %}[View on OpenMensa](https://openmensa.org/c/{{ canteen.om_id }}){:target="_blank"}{% else %}Not added yet{% endif %} |
{% endfor %} 