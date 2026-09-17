// 2026-09-17：JP/TW/SG/HK/US 独立组 + EU 欧洲 + AS 其余亚洲；保留未知地区兜底。
// Clash Verge Rev：放入当前订阅的「扩展脚本」。每次更新订阅后自动重新生成分组。
// 不含订阅地址、节点服务器、UUID；真实节点由 config.proxies 动态读取。
const OPTIONS = {
  blockQUIC: true, // 与目标模板一致：阻止公网 UDP/443。需要 HTTP/3 时改为 false。
  testURL: 'https://www.google.com/',
  testInterval: 180,
  tolerance: 25,
  // 只保留各国/地区组时，改为 false；其他节点仍在总分组中。
  includeOtherRegion: true,
};

function main(config) {
  if (!config || !Array.isArray(config.proxies)) {
    throw new Error('此脚本适用于包含 proxies 节点列表的订阅；不适用于仅含 proxy-providers 的订阅。');
  }
  const infoNode = /剩余流量|距离下次重置|距離下次重置|套餐到期|到期时间|官网|官方网站|订阅更新|流量重置|traffic remaining|expire date/i;
  const nodes = config.proxies.filter(p => p && typeof p.name === 'string' && p.name.trim() && p.server && !infoNode.test(p.name));
  if (!nodes.length) throw new Error('没有可用节点，请检查订阅内容。');
  const names = nodes.map(p => p.name);
  if (new Set(names).size !== names.length) throw new Error('节点名称重复，请先修正订阅中的重复名称。');

  // 支持当前订阅的英文全称/旗帜，也支持常见中文和 HK-1、JP1-HY2 等命名。
  const regions = [
  [
    "JP",
    "🇯🇵|日本|Japan|\\bJP(?=\\d|\\b)"
  ],
  [
    "TW",
    "🇹🇼|台湾|台灣|Taiwan|\\bTW(?=\\d|\\b)"
  ],
  [
    "SG",
    "🇸🇬|新加坡|狮城|獅城|Singapore|\\bSG(?=\\d|\\b)"
  ],
  [
    "HK",
    "🇭🇰|香港|Hong\\s*Kong|\\bHK(?=\\d|\\b)"
  ],
  [
    "US",
    "🇺🇸|美国|美國|United\\s*States|\\bUSA?\\b|\\bUS(?=\\d)"
  ],
  [
    "EU",
    "🇳🇱|🇬🇧|🇩🇪|🇫🇷|🇨🇭|🇸🇪|🇫🇮|🇳🇴|🇩🇰|🇮🇹|🇪🇸|🇵🇱|🇦🇹|🇮🇪|🇵🇹|荷兰|荷蘭|英国|英國|德国|德國|法国|法國|瑞士|瑞典|芬兰|挪威|丹麦|意大利|西班牙|波兰|奥地利|爱尔兰|葡萄牙|Netherlands|United\\s*Kingdom|Britain|Germany|France|Switzerland|Sweden|Finland|Norway|Denmark|Italy|Spain|Poland|Austria|Ireland|Portugal|\\b(?:NL|UK|GB|DE|FR|CH|SE|FI|NO|DK|IT|ES|PL|AT|IE|PT)(?=\\d|\\b)"
  ],
  [
    "AS",
    "🇰🇷|🇲🇾|🇮🇳|🇹🇭|🇻🇳|🇮🇩|🇵🇭|🇲🇴|🇨🇳|韩国|韓國|马来西亚|馬來西亞|印度|泰国|泰國|越南|印尼|菲律宾|菲律賓|澳门|澳門|中国|中國|Korea|Malaysia|India|Thailand|Vietnam|Indonesia|Philippines|Macau|Macao|China|\\b(?:KR|MY|IN|TH|VN|ID|PH|MO|CN)(?=\\d|\\b)"
  ]
].map(function(item) { return [item[0], new RegExp(item[1], "i")]; });
  const buckets = regions.map(([code]) => ({code, names: []}));
  const other = [];
  names.forEach(name => {
    const index = regions.findIndex(([, pattern]) => pattern.test(name));
    if (index >= 0) buckets[index].names.push(name);
    else other.push(name);
  });
  if (OPTIONS.includeOtherRegion && other.length) buckets.push({code: '其他', names: other});
  const available = buckets.filter(b => b.names.length);
  function auto(name, proxies) {
    return {name, type: 'url-test', proxies, url: OPTIONS.testURL, interval: OPTIONS.testInterval, tolerance: OPTIONS.tolerance, lazy: true};
  }
  function balance(name, proxies) {
    return {name, type: 'load-balance', proxies, url: OPTIONS.testURL, interval: 300, strategy: 'consistent-hashing', lazy: true};
  }
  const choices = ['自动选择', '负载均衡'].concat(...available.map(b => [b.code + '自动选择', b.code + '负载均衡']));
  const groups = [
    {name: '主代理', type: 'select', proxies: choices.concat('DIRECT', names)},
    auto('自动选择', names), balance('负载均衡', names),
  ];
  available.forEach(b => groups.push(auto(b.code + '自动选择', b.names), balance(b.code + '负载均衡', b.names)));
  const directDefault = ['Bilibili', 'Steam', 'Apple', 'Microsoft', '中国大陆网站'];
  const services = ['Bahamut', 'Bilibili', 'Discord', 'GoogleFCM', 'Netflix', 'OpenAI', 'Speedtest', 'Spotify', 'Steam', 'Telegram', 'TikTok', 'Apple', 'Google', 'Microsoft', '黑名单网站', '中国大陆网站'];
  services.forEach(name => {
    const defaults = directDefault.includes(name) ? ['DIRECT', '主代理'] : ['主代理'];
    groups.push({name, type: 'select', proxies: defaults.concat(choices, names)});
  });
  const reserved = new Set(['DIRECT', 'REJECT'].concat(groups.map(g => g.name)));
  names.forEach(name => { if (reserved.has(name)) throw new Error('节点名与策略组冲突：' + name); });

  // 全局扩展先执行；保留它添加的 fox 规则，避免随后覆盖分流配置时丢失。
  const foxProviders = {};
  ['fox-proxy', 'fox-direct', 'fox-reject'].forEach(name => {
    if (config['rule-providers'] && config['rule-providers'][name]) {
      foxProviders[name] = config['rule-providers'][name];
    }
  });
  const foxRules = [
    ['fox-reject', 'REJECT'], ['fox-direct', 'DIRECT'], ['fox-proxy', 'Google'],
  ].filter(([name]) => foxProviders[name]).map(([name, target]) => 'RULE-SET,' + name + ',' + target);

  config.proxies = nodes;
  config['proxy-groups'] = groups;
  config['rule-providers'] = {
  "Bahamut-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Bahamut/Bahamut-Site.mrs",
    "path": "./ruleset/Bahamut-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Apple-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Apple/Apple-Site.mrs",
    "path": "./ruleset/Apple-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Apple-IP": {
    "type": "http",
    "behavior": "ipcidr",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Apple/Apple-IP.mrs",
    "path": "./ruleset/Apple-IP.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Bilibili-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Bilibili/Bilibili-Site.mrs",
    "path": "./ruleset/Bilibili-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Bilibili-IP": {
    "type": "http",
    "behavior": "ipcidr",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Bilibili/Bilibili-IP.mrs",
    "path": "./ruleset/Bilibili-IP.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "China-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/China/China-Site.mrs",
    "path": "./ruleset/China-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "China-IP": {
    "type": "http",
    "behavior": "ipcidr",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/China/China-IP.mrs",
    "path": "./ruleset/China-IP.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Discord-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Discord/Discord-Site.mrs",
    "path": "./ruleset/Discord-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "GFWList-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/GFWList/GFWList-Site.mrs",
    "path": "./ruleset/GFWList-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Google-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Google/Google-Site.mrs",
    "path": "./ruleset/Google-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Google-IP": {
    "type": "http",
    "behavior": "ipcidr",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Google/Google-IP.mrs",
    "path": "./ruleset/Google-IP.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "GoogleFCM-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/GoogleFCM/GoogleFCM-Site.mrs",
    "path": "./ruleset/GoogleFCM-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Local-IP": {
    "type": "http",
    "behavior": "ipcidr",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Local/Local-IP.mrs",
    "path": "./ruleset/Local-IP.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Microsoft-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Microsoft/Microsoft-Site.mrs",
    "path": "./ruleset/Microsoft-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Netflix-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Netflix/Netflix-Site.mrs",
    "path": "./ruleset/Netflix-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Netflix-IP": {
    "type": "http",
    "behavior": "ipcidr",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Netflix/Netflix-IP.mrs",
    "path": "./ruleset/Netflix-IP.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "OpenAI-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/OpenAI/OpenAI-Site.mrs",
    "path": "./ruleset/OpenAI-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "OpenAI-IP": {
    "type": "http",
    "behavior": "ipcidr",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/OpenAI/OpenAI-IP.mrs",
    "path": "./ruleset/OpenAI-IP.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Speedtest-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Speedtest/Speedtest-Site.mrs",
    "path": "./ruleset/Speedtest-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Spotify-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Spotify/Spotify-Site.mrs",
    "path": "./ruleset/Spotify-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Spotify-IP": {
    "type": "http",
    "behavior": "ipcidr",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Spotify/Spotify-IP.mrs",
    "path": "./ruleset/Spotify-IP.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Steam-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Steam/Steam-Site.mrs",
    "path": "./ruleset/Steam-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Telegram-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Telegram/Telegram-Site.mrs",
    "path": "./ruleset/Telegram-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "Telegram-IP": {
    "type": "http",
    "behavior": "ipcidr",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/Telegram/Telegram-IP.mrs",
    "path": "./ruleset/Telegram-IP.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  },
  "TikTok-Site": {
    "type": "http",
    "behavior": "domain",
    "format": "mrs",
    "url": "https://cdn.jsdmirror.com/gh/HosheaPDNX/rule-set@V2.0.0/mihomo/TikTok/TikTok-Site.mrs",
    "path": "./ruleset/TikTok-Site.mrs",
    "proxy": "DIRECT",
    "interval": 86400
  }
};
  Object.assign(config['rule-providers'], foxProviders);
  // 整体替换旧 DNS，避免残留 #节点选择 / 旧 rule-set 引用。端口和 TUN 不从目标模板复制。
  const dnsListen = config.dns && config.dns.listen;
  config.dns = {
  "enable": true,
  "enhanced-mode": "fake-ip",
  "fake-ip-range": "198.18.0.1/16",
  "fake-ip-filter-mode": "blacklist",
  "prefer-h3": false,
  "respect-rules": true,
  "use-hosts": false,
  "use-system-hosts": false,
  "ipv6": false,
  "fake-ip-filter": [
    "*.lan",
    "*.local",
    "*.arpa",
    "time.*.com",
    "ntp.*.com",
    "+.market.xiaomi.com",
    "localhost.ptlogin2.qq.com",
    "*.msftncsi.com",
    "www.msftconnecttest.com"
  ],
  "default-nameserver": [
    "223.5.5.5",
    "119.29.29.29"
  ],
  "nameserver": [
    "https://doh.pub/dns-query",
    "https://dns.alidns.com/dns-query",
    "8.8.8.8"
  ],
  "direct-nameserver": [
    "https://doh.pub/dns-query",
    "https://dns.alidns.com/dns-query",
    "223.5.5.5",
    "119.29.29.29"
  ],
  "direct-nameserver-follow-policy": true,
  "fallback": [
    "https://1.1.1.1/dns-query",
    "https://8.8.8.8/dns-query",
    "https://dns.google/dns-query"
  ],
  "fallback-filter": {
    "geoip": true,
    "geoip-code": "CN",
    "ipcidr": [
      "240.0.0.0/4",
      "0.0.0.0/32"
    ],
    "domain": [
      "+.google.com",
      "+.facebook.com",
      "+.youtube.com",
      "+.twitter.com",
      "+.github.com"
    ]
  },
  "proxy-server-nameserver": [
    "https://doh.pub/dns-query",
    "https://dns.alidns.com/dns-query",
    "tls://223.5.5.5"
  ]
};
  if (dnsListen) config.dns.listen = dnsListen;
  config.ipv6 = false;
  config.mode = 'rule';
  delete config['global-client-fingerprint']; // 保留节点自身的指纹。
  config['mixed-port'] = 10808;
  config.profile = Object.assign({}, config.profile, {'store-selected': true, 'store-fake-ip': true});
  config['unified-delay'] = true;
  config['tcp-concurrent'] = true;

  // 私网在 QUIC 阻断之前放行，包括用户的 192.168.10.0/24 局域网。
  const localRules = [
    'DOMAIN,localhost,DIRECT', 'DOMAIN-SUFFIX,lan,DIRECT', 'DOMAIN-SUFFIX,local,DIRECT',
    'IP-CIDR,127.0.0.0/8,DIRECT,no-resolve', 'IP-CIDR,10.0.0.0/8,DIRECT,no-resolve',
    'IP-CIDR,172.16.0.0/12,DIRECT,no-resolve', 'IP-CIDR,192.168.0.0/16,DIRECT,no-resolve',
    'IP-CIDR,100.64.0.0/10,DIRECT,no-resolve', 'IP-CIDR,169.254.0.0/16,DIRECT,no-resolve',
    'IP-CIDR6,::1/128,DIRECT,no-resolve', 'IP-CIDR6,fc00::/7,DIRECT,no-resolve',
    'IP-CIDR6,fe80::/10,DIRECT,no-resolve', 'RULE-SET,Local-IP,DIRECT,no-resolve',
  ];
  const purposeRules = [
  "DOMAIN,ntp.aliyun.com,DIRECT",
  "DOMAIN-KEYWORD,msftconnecttest.com,主代理",
  "DOMAIN-KEYWORD,msftncsi.com,主代理",
  "DOMAIN-KEYWORD,googleapis,Google",
  "RULE-SET,Bahamut-Site,Bahamut",
  "RULE-SET,Bilibili-Site,Bilibili",
  "RULE-SET,Discord-Site,Discord",
  "RULE-SET,GoogleFCM-Site,GoogleFCM",
  "RULE-SET,Netflix-Site,Netflix",
  "RULE-SET,OpenAI-Site,OpenAI",
  "RULE-SET,Speedtest-Site,Speedtest",
  "RULE-SET,Spotify-Site,Spotify",
  "RULE-SET,Steam-Site,Steam",
  "RULE-SET,Telegram-Site,Telegram",
  "RULE-SET,TikTok-Site,TikTok",
  "RULE-SET,Apple-Site,Apple",
  "RULE-SET,Google-Site,Google",
  "RULE-SET,Microsoft-Site,Microsoft",
  "RULE-SET,GFWList-Site,黑名单网站",
  "RULE-SET,China-Site,中国大陆网站",
  "RULE-SET,Bilibili-IP,Bilibili",
  "RULE-SET,Netflix-IP,Netflix",
  "RULE-SET,OpenAI-IP,OpenAI",
  "RULE-SET,Spotify-IP,Spotify",
  "RULE-SET,Telegram-IP,Telegram",
  "RULE-SET,Apple-IP,Apple",
  "RULE-SET,Google-IP,Google",
  "RULE-SET,China-IP,中国大陆网站",
  "MATCH,主代理"
];
  config.rules = foxRules.concat(localRules, OPTIONS.blockQUIC ? ['AND,((DST-PORT,443),(NETWORK,UDP)),REJECT'] : [], purposeRules);
  return config;
}
