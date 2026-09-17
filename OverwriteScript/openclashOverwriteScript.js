#!/bin/sh
# OpenClash v0.47.156 custom overwrite hook; UTF-8, LF.
# Install: /etc/openclash/custom/openclash_custom_overwrite.sh
# Argument 1 is supplied by OpenClash. Optional argument 2: --check (no write).
# Edit the options in FOX_SETTINGS below to customize tests or QUIC blocking.
if [ -z "$1" ] || [ ! -f "$1" ]; then
  echo '[fox-overwrite] Missing configuration file argument' >&2
  exit 1
fi
if ! command -v ruby >/dev/null 2>&1; then
  echo '[fox-overwrite] Ruby is required by this OpenClash hook' >&2
  exit 1
fi
FOX_LOG=/tmp/openclash.log
if [ "$2" = '--check' ]; then
  FOX_LOG=/dev/stdout
fi
ruby -E UTF-8 - "$@" >>"$FOX_LOG" 2>&1 <<'FOX_RUBY'
# encoding: UTF-8
require 'yaml'

# Embedded data is extracted from the user's Clash Verge source file.
SETTINGS = YAML.safe_load(<<'FOX_SETTINGS', aliases: true)
{
  "options": {
    "blockQUIC": true,
    "testURL": "https://www.google.com/",
    "testInterval": 180,
    "tolerance": 25,
    "includeOtherRegion": true
  },
  "infoPattern": "剩余流量|距离下次重置|距離下次重置|套餐到期|到期时间|官网|官方网站|订阅更新|流量重置|traffic remaining|expire date",
  "regions": [
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
  ],
  "services": [
    "Bahamut",
    "Bilibili",
    "Discord",
    "GoogleFCM",
    "Netflix",
    "OpenAI",
    "Speedtest",
    "Spotify",
    "Steam",
    "Telegram",
    "TikTok",
    "Apple",
    "Google",
    "Microsoft",
    "黑名单网站",
    "中国大陆网站"
  ],
  "directDefault": [
    "Bilibili",
    "Steam",
    "Apple",
    "Microsoft",
    "中国大陆网站"
  ],
  "providers": {
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
    },
    "fox-reject": {
      "type": "http",
      "behavior": "classical",
      "format": "yaml",
      "url": "https://clash.huguaxi.com/Aokchiharu/foxclashrules/main/fox-reject.yaml",
      "path": "./rule_provider/fox-reject.yaml",
      "interval": 43200
    },
    "fox-direct": {
      "type": "http",
      "behavior": "classical",
      "format": "yaml",
      "url": "https://clash.huguaxi.com/Aokchiharu/foxclashrules/main/fox-direct.yaml",
      "path": "./rule_provider/fox-direct.yaml",
      "interval": 43200
    },
    "fox-proxy": {
      "type": "http",
      "behavior": "classical",
      "format": "yaml",
      "url": "https://clash.huguaxi.com/Aokchiharu/foxclashrules/main/fox-proxy.yaml",
      "path": "./rule_provider/fox-proxy.yaml",
      "interval": 43200
    }
  },
  "dns": {
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
  },
  "foxRules": [
    "RULE-SET,fox-reject,REJECT",
    "RULE-SET,fox-direct,DIRECT",
    "RULE-SET,fox-proxy,Google"
  ],
  "localRules": [
    "DOMAIN,localhost,DIRECT",
    "DOMAIN-SUFFIX,lan,DIRECT",
    "DOMAIN-SUFFIX,local,DIRECT",
    "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
    "IP-CIDR,10.0.0.0/8,DIRECT,no-resolve",
    "IP-CIDR,172.16.0.0/12,DIRECT,no-resolve",
    "IP-CIDR,192.168.0.0/16,DIRECT,no-resolve",
    "IP-CIDR,100.64.0.0/10,DIRECT,no-resolve",
    "IP-CIDR,169.254.0.0/16,DIRECT,no-resolve",
    "IP-CIDR6,::1/128,DIRECT,no-resolve",
    "IP-CIDR6,fc00::/7,DIRECT,no-resolve",
    "IP-CIDR6,fe80::/10,DIRECT,no-resolve",
    "RULE-SET,Local-IP,DIRECT,no-resolve"
  ],
  "purposeRules": [
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
  ]
}
FOX_SETTINGS

class FoxMissingRuleProvider < StandardError; end

# DNS may reference rule providers in array values or mapping keys.
def fox_dns_rule_sets(value, result = [])
  case value
  when Hash
    value.each { |key, child| fox_dns_rule_sets(key, result); fox_dns_rule_sets(child, result) }
  when Array
    value.each { |child| fox_dns_rule_sets(child, result) }
  when String
    if value.start_with?('rule-set:')
      result.concat(value.sub(/\Arule-set:/, '').split(',').map(&:strip).reject(&:empty?))
    end
  end
  result.uniq
end

def fox_transform(config)
  raise 'Configuration root must be a mapping' unless config.is_a?(Hash)
  raise 'Only inline proxies subscriptions are supported' unless config['proxies'].is_a?(Array)
  options = SETTINGS['options']
  info = Regexp.new(SETTINGS['infoPattern'], Regexp::IGNORECASE)
  nodes = config['proxies'].select do |p|
    p.is_a?(Hash) && p['name'].is_a?(String) && !p['name'].strip.empty? &&
      p['server'] && !p['server'].to_s.empty? && !info.match(p['name'])
  end
  raise 'No usable nodes; original configuration was not changed' if nodes.empty?
  names = nodes.map { |p| p['name'] }
  raise 'Duplicate node names' unless names.uniq.size == names.size
  buckets = SETTINGS['regions'].map { |code, pattern| [code, Regexp.new(pattern, Regexp::IGNORECASE), []] }
  other = []
  names.each do |name|
    bucket = buckets.find { |b| b[1].match(name) }
    bucket ? bucket[2].push(name) : other.push(name)
  end
  buckets.push(['其他', nil, other]) if options['includeOtherRegion'] && !other.empty?
  available = buckets.reject { |b| b[2].empty? }
  auto = lambda do |name, proxies|
    {'name'=>name, 'type'=>'url-test', 'proxies'=>proxies.dup,
     'url'=>options['testURL'], 'interval'=>options['testInterval'],
     'tolerance'=>options['tolerance'], 'lazy'=>true}
  end
  balance = lambda do |name, proxies|
    {'name'=>name, 'type'=>'load-balance', 'proxies'=>proxies.dup,
     'url'=>options['testURL'], 'interval'=>300, 'strategy'=>'consistent-hashing', 'lazy'=>true}
  end
  choices = ['自动选择', '负载均衡'] + available.flat_map { |b| [b[0] + '自动选择', b[0] + '负载均衡'] }
  groups = [
    {'name'=>'主代理', 'type'=>'select', 'proxies'=>choices + ['DIRECT'] + names},
    auto.call('自动选择', names), balance.call('负载均衡', names)
  ]
  available.each { |b| groups.push(auto.call(b[0] + '自动选择', b[2]), balance.call(b[0] + '负载均衡', b[2])) }
  SETTINGS['services'].each do |name|
    defaults = SETTINGS['directDefault'].include?(name) ? ['DIRECT', '主代理'] : ['主代理']
    groups.push({'name'=>name, 'type'=>'select', 'proxies'=>defaults + choices + names})
  end
  reserved = ['DIRECT', 'REJECT'] + groups.map { |g| g['name'] }
  raise 'Node name conflicts with a proxy group' unless (reserved & names).empty?
  config['proxies'] = nodes
  config['proxy-groups'] = groups
  incoming_providers = config['rule-providers'].is_a?(Hash) ? config['rule-providers'] : {}
  config['rule-providers'] = Marshal.load(Marshal.dump(SETTINGS['providers']))
  # OpenClash owns provider cache locations. Use its native rule_provider directory.
  config['rule-providers'].each do |name, p|
    extension = p['format'] == 'mrs' ? 'mrs' : 'yaml'
    p['path'] = './rule_provider/' + name + '.' + extension
  end

  # Keep DNS listener and operating mode generated by OpenClash, not desktop defaults.
  incoming_dns = config['dns'].is_a?(Hash) ? config['dns'] : {}
  config['dns'] = Marshal.load(Marshal.dump(SETTINGS['dns']))
  %w[enable listen enhanced-mode fake-ip-range fake-ip-range6 fake-ip-filter fake-ip-filter-mode ipv6].each do |key|
    config['dns'][key] = incoming_dns[key] if incoming_dns.key?(key)
  end
  # Preserve definitions required by OpenClash's generated DNS, notably oc-cn-domain.
  # Copy after normalizing our own paths: system providers retain original settings.
  fox_dns_rule_sets(config['dns']).each do |name|
    if incoming_providers[name].is_a?(Hash)
      config['rule-providers'][name] = Marshal.load(Marshal.dump(incoming_providers[name]))
    elsif !config['rule-providers'][name].is_a?(Hash)
      raise FoxMissingRuleProvider, 'DNS rule-set definition missing: ' + name
    end
  end
  # Router IPv6, TUN, controller, redir-port, tproxy-port, LAN access remain OpenClash-owned.
  config['mixed-port'] = 10808
  config['mode'] = 'rule'
  config.delete('global-client-fingerprint') # Keep per-node fingerprints.
  config['profile'] = {} unless config['profile'].is_a?(Hash)
  config['profile'].merge!('store-selected'=>true, 'store-fake-ip'=>true)
  config['unified-delay'] = true
  config['tcp-concurrent'] = true
  config['rules'] = SETTINGS['foxRules'] + SETTINGS['localRules'] +
    (options['blockQUIC'] ? ['AND,((DST-PORT,443),(NETWORK,UDP)),REJECT'] : []) + SETTINGS['purposeRules']

  valid = reserved + names
  groups.each do |g|
    raise 'Empty or unresolved proxy group' if g['proxies'].empty? || g['proxies'].any? { |n| !valid.include?(n) }
  end
  config['rules'].each do |rule|
    parts = rule.split(',')
    destination = parts[-1] == 'no-resolve' ? parts[-2] : parts[-1]
    raise 'Unresolved rule destination' unless valid.include?(destination)
    if parts[0] == 'RULE-SET' && !config['rule-providers'].key?(parts[1])
      raise 'Unresolved rule provider'
    end
  end
  # Existing chained nodes must not silently reference groups removed by this conversion.
  nodes.each do |p|
    target = p['dialer-proxy']
    raise 'Unresolved node dialer-proxy' if target && !valid.include?(target)
  end
  config
end

if __FILE__ == $PROGRAM_NAME
  temporary = nil
  temporary_created = false
  begin
    path = ARGV.fetch(0)
    check_only = ARGV[1] == '--check'
    raise 'Unexpected argument' if ARGV[1] && !check_only
    original = File.binread(path)
    config = YAML.safe_load(original.force_encoding('UTF-8'), aliases: true)
    result = fox_transform(config)
    encoded = YAML.dump(result)
    reparsed = YAML.safe_load(encoded, aliases: true)
    raise 'YAML round-trip validation failed' unless reparsed == result
    unless check_only
      temporary = path + '.fox-' + Process.pid.to_s + '.tmp'
      File.open(temporary, File::WRONLY | File::CREAT | File::EXCL, 0600) do |file|
        temporary_created = true
        file.write(encoded)
        file.flush
        file.fsync
      end
      raise 'Configuration changed concurrently; retry' unless File.binread(path) == original.b
      File.rename(temporary, path)
      temporary = nil
    end
    puts Time.now.strftime('%Y-%m-%d %H:%M:%S') + ' [信息] [fox-overwrite] ' + (check_only ? 'CHECK OK' : 'APPLIED') +
      ': nodes=' + result['proxies'].size.to_s + ', groups=' + result['proxy-groups'].size.to_s +
      ', providers=' + result['rule-providers'].size.to_s + ', mixed-port=10808'
  rescue StandardError => error
    # Never log configuration contents or node credentials.
    detail = error.is_a?(FoxMissingRuleProvider) ? error.message : 'Check input YAML, inline nodes and names.'
    warn Time.now.strftime('%Y-%m-%d %H:%M:%S') + ' [错误] [fox-overwrite] FAILED (' + error.class.to_s + '); configuration not replaced. ' + detail
    exit 1
  ensure
    File.delete(temporary) if temporary_created && temporary && File.exist?(temporary)
  end
end

FOX_RUBY
FOX_STATUS=$?
if [ "$FOX_STATUS" -ne 0 ]; then
  echo '[fox-overwrite] Failed; original configuration was not replaced. See /tmp/openclash.log.' >&2
fi
exit "$FOX_STATUS"
