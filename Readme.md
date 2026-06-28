# 狐瓜西的clash私有规则

```
prepend-rule-providers:
  fox-proxy:
    type: http
    behavior: classical
    url: "https://clash.huguaxi.com/Aokchiharu/foxclashrules/main/fox-proxy.yaml"
    path: ./rules/fox-proxy.yaml
    interval: 43200

  fox-direct:
    type: http
    behavior: classical
    url: "https://clash.huguaxi.com/Aokchiharu/foxclashrules/main/fox-direct.yaml"
    path: ./rules/fox-direct.yaml
    interval: 43200

  fox-reject:
    type: http
    behavior: classical
    url: "https://clash.huguaxi.com/Aokchiharu/foxclashrules/main/fox-reject.yaml"
    path: ./rules/fox-reject.yaml
    interval: 43200

prepend-rules:
  - RULE-SET,fox-reject,REJECT
  - RULE-SET,fox-direct,DIRECT
  # 如果你的机场中没有名为 Google 的策略组，请务必将下方的 Google 替换为你实际的策略组名称
  - RULE-SET,fox-proxy,Google
  
```