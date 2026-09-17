// Clash Mi 自定义覆写，类型选择 JS。iOS / Android 共用。
// 目标：1.0.29.1053 / Mihomo 1.19.30；绑定原始节点订阅。
// 在应用中启用 TUN 覆写；追加覆写选择「内置-覆写」。
// main 返回 JSON 文本（合法 YAML），避免平台 JS 对象桥接差异。
const OPTIONS = {
  blockQUIC: true, // 与目标模板一致：阻止公网 UDP/443。需要 HTTP/3 时改为 false。
  testURL: 'https://www.google.com/',
  testInterval: 180,
  tolerance: 25,
  // 只保留各国/地区组时，改为 false；其他节点仍在总分组中。
  includeOtherRegion: true,
};

function applyPurposeConfig(config) {
  if (!config || !Array.isArray(config.proxies)) {
    throw new Error('此脚本适用于包含 proxies 节点列表的订阅；不适用于仅含 proxy-providers 的订阅。');
  }
  const infoNode = /剩余流量|套餐到期|到期时间|官网|官方网站|订阅更新|流量重置|traffic remaining|expire date/i;
  const nodes = config.proxies.filter(p => p && typeof p.name === 'string' && p.name.trim() && p.server && !infoNode.test(p.name));
  if (!nodes.length) throw new Error('没有可用节点，请检查订阅内容。');
  const names = nodes.map(p => p.name);
  if (new Set(names).size !== names.length) throw new Error('节点名称重复，请先修正订阅中的重复名称。');

  // 支持当前订阅的英文全称/旗帜，也支持常见中文和 HK-1、JP1-HY2 等命名。
  const regions = [
    ['HK', /🇭🇰|香港|Hong\s*Kong|\bHK(?=\d|\b)/i],
    ['JP', /🇯🇵|日本|Japan|\bJP(?=\d|\b)/i],
    ['KR', /🇰🇷|韩国|韓國|Korea|\bKR(?=\d|\b)/i],
    ['SG', /🇸🇬|新加坡|狮城|獅城|Singapore|\bSG(?=\d|\b)/i],
    ['TW', /🇹🇼|台湾|台灣|Taiwan|\bTW(?=\d|\b)/i],
    ['US', /🇺🇸|美国|美國|United\s*States|\bUSA?\b|\bUS(?=\d)/i],
    ['MY', /🇲🇾|马来西亚|馬來西亞|Malaysia|\bMY(?=\d|\b)/i],
    ['NL', /🇳🇱|荷兰|荷蘭|Netherlands|\bNL(?=\d|\b)/i],
    ['UK', /🇬🇧|英国|英國|United\s*Kingdom|Britain|\b(?:UK|GB)(?=\d|\b)/i],
    ['DE', /🇩🇪|德国|德國|Germany|\bDE(?=\d|\b)/i],
  ];
  const buckets = regions.map(([code]) => ({code, names: []}));
  const other = [];
  names.forEach(name => {
    const index = regions.findIndex(([, pattern]) => pattern.test(name));
    if (index >= 0) buckets[index].names.push(name);
    else other.push(name);
  });
  if (OPTIONS.includeOtherRegion && other.length) buckets.push({code: '其他', names: other});
  const available = buckets.filter(b => b.names.length);
  const autoNames = available.map(b => b.code + '自动选择');
  const balanceNames = available.map(b => b.code + '负载均衡');
  function auto(name, proxies) {
    return {name, type: 'url-test', proxies, url: OPTIONS.testURL, interval: OPTIONS.testInterval, tolerance: OPTIONS.tolerance, lazy: true};
  }
  function balance(name, proxies) {
    return {name, type: 'load-balance', proxies, url: OPTIONS.testURL, interval: 300, strategy: 'consistent-hashing', lazy: true};
  }
  const choices = ['自动选择', '负载均衡'].concat(autoNames, balanceNames);
  const groups = [
    {name: '主代理', type: 'select', proxies: choices.concat('DIRECT', names)},
    auto('自动选择', names), balance('负载均衡', names),
  ];
  available.forEach(b => groups.push(auto(b.code + '自动选择', b.names)));
  available.forEach(b => groups.push(balance(b.code + '负载均衡', b.names)));
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

// Clash Mi 入口：自包含，不需要 Verge 全局脚本或 OpenClash 组件。
function main(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('订阅配置必须是对象');
  }
  var providers = Object.assign({}, config['rule-providers'] || {});
  ['fox-proxy', 'fox-direct', 'fox-reject'].forEach(function(name) {
    providers[name] = {
      type: 'http', behavior: 'classical', format: 'yaml',
      url: 'https://clash.huguaxi.com/Aokchiharu/foxclashrules/main/' + name + '.yaml',
      path: './ruleset/' + name + '.yaml', interval: 43200
    };
  });
  config['rule-providers'] = providers;
  config = applyPurposeConfig(config);

  // VPN/TUN 和控制接口由 Clash Mi 的平台适配层及内置覆写生成。
  // 清除订阅可能附带的桌面/路由器设备名、控制端口和路由配置。
  ['tun', 'redir-port', 'tproxy-port', 'port', 'socks-port',
   'external-controller', 'external-controller-tls', 'external-controller-unix',
   'external-controller-pipe', 'external-ui', 'external-ui-url', 'external-ui-name',
   'external-controller-cors', 'secret', 'authentication', 'listeners',
   'interface-name', 'routing-mark', 'ntp', 'geox-url', 'sub-rules', 'sniffer'].forEach(function(key) {
    delete config[key];
  });
  config['mixed-port'] = 10808;
  config['allow-lan'] = false;
  config['bind-address'] = '127.0.0.1';
  config['find-process-mode'] = 'off';
  config['geo-auto-update'] = false;
  // 以 MRS 规则集分流；取消 DNS fallback 对 GeoIP 数据库的依赖。
  config.dns['fallback-filter'].geoip = false;
  delete config.dns['fallback-filter']['geoip-code'];
  delete config.dns.listen;

  // 检查最终分组、链式节点和规则集引用，避免输出缺失引用的配置。
  var groups = config['proxy-groups'];
  var known = new Set(['DIRECT', 'REJECT']);
  var groupMap = Object.create(null);
  config.proxies.forEach(function(p) { known.add(p.name); });
  groups.forEach(function(g) { known.add(g.name); groupMap[g.name] = g; });
  function visit(name, parents) {
    if (!known.has(name)) throw new Error('不存在的代理引用：' + name);
    if (!groupMap[name]) return;
    if (parents.indexOf(name) >= 0) throw new Error('策略组循环：' + name);
    groupMap[name].proxies.forEach(function(child) { visit(child, parents.concat(name)); });
  }
  groups.forEach(function(g) {
    if (!g.proxies.length) throw new Error('空策略组：' + g.name);
    visit(g.name, []);
  });
  config.proxies.forEach(function(p) {
    if (p['dialer-proxy'] && !known.has(p['dialer-proxy'])) throw new Error('链式代理引用不存在：' + p['dialer-proxy']);
  });
  config.rules.forEach(function(rule) {
    var parts = rule.split(',');
    var target = parts[parts.length - 1] === 'no-resolve' ? parts[parts.length - 2] : parts[parts.length - 1];
    if (!known.has(target)) throw new Error('规则目标不存在：' + target);
    if (parts[0] === 'RULE-SET' && !config['rule-providers'][parts[1]]) throw new Error('规则集不存在：' + parts[1]);
  });
  return JSON.stringify(config);
}
