import{i as e}from"./preload-helper-CT_b8DTk.js";import{t}from"./jsx-runtime-DqZldVDK.js";import{t as n}from"./Text-BXEuttRu.js";import{t as r}from"./Icon-D_xlLxYl.js";import{t as i}from"./Icon-DMgFGzBF.js";import{t as a}from"./IconButton-zqY04WxP.js";import{t as o}from"./IconButton-C3dVCTAf.js";import{i as s,o as c}from"./Stack-CfnjGhmq.js";import{t as l}from"./Layout-B2hEnZFK.js";import{t as u}from"./Text-CRXEW_aT.js";function d({value:e,label:t,className:n,ref:r,...i}){let a=e!==void 0&&e!==``,o={0:{className:`astryx9f619 astryx3nfvp2 astryx6s0dn4 astryxl56j7k astryx2anes5 astryx1vzrytg astryx118gdga astryxl5f9rk astryx2lah0s astryx47corl astryxwvh9j7`},1:{className:`astryx9f619 astryx3nfvp2 astryx6s0dn4 astryxl56j7k astryx2lah0s astryx47corl astryxwvh9j7 astryx14atkfc astryx1059jdq astryxipm242 astryxfn1xvj astryx1lilgj8 astryx4xa9pn astryxhui5f1 astryx6qeg0d astryx1b1er19 astryx1eee10p astryx1detez4 astryxuxw1ft astryx2b8uid astryx1a46atw`}}[!!a<<0],s=t?{role:`img`,"aria-label":t}:{"aria-hidden":!0};return(0,f.jsx)(`span`,{...o,...i,...s,className:[o.className,n].filter(Boolean).join(` `),ref:r,children:a?e:null})}var f,p=e((()=>{f=t(),d.__docgenInfo={description:`Renders the Material 3 small dot or large value badge. Place the surface
beside or over its owner with CSS; include the count in the owner's
accessible name when the badge is decorative.

@example
\`\`\`
<MaterialBadge />
<MaterialBadge value={3} />
<MaterialBadge value="99+" label="More than 99 notifications" />
\`\`\``,methods:[],displayName:`MaterialBadge`,props:{value:{required:!1,tsType:{name:`union`,raw:`string | number`,elements:[{name:`string`},{name:`number`}]},description:`Count or short text. Omit or pass an empty string for the small dot.`},label:{required:!1,tsType:{name:`string`},description:`Accessible name when the badge conveys meaning on its own.`},ref:{required:!1,tsType:{name:`Ref`,elements:[{name:`HTMLSpanElement`}],raw:`Ref<HTMLSpanElement>`},description:`Ref forwarded to the badge surface.`}},composes:[`Omit`]}})),m,h,g,_,v;e((()=>{i(),o(),l(),u(),p(),m=t(),h={gallery:{ks0D6T:`x7ep2pv`,kmVPX3:`xggk2y7`,kg3NbH:null,kuDDbn:null,kE3dHu:null,kP0aTx:null,kpe85a:null,k8WAf4:null,kLKAdn:null,kGO01o:null,$$css:!0},narrow:{kzqmXN:`x16grhtn`,ks0D6T:`x193iq5w`,$$css:!0}},g={title:`Material 3/MaterialBadge`,component:d,tags:[`autodocs`],argTypes:{value:{control:`text`},label:{control:`text`}}},_={name:`Material 3 Review`,globals:{astryxTheme:`material3`},args:{value:3,label:`3 notifications`},render:e=>(0,m.jsxs)(s,{gap:6,xstyle:h.gallery,children:[(0,m.jsxs)(s,{gap:2,children:[(0,m.jsx)(`h2`,{children:`Interactive badge`}),(0,m.jsx)(n,{type:`supporting`,children:`Edit the value or accessible label in Controls. Clear the value for the 6px dot. Light, dark, and RTL are in the toolbar.`}),(0,m.jsx)(c,{children:(0,m.jsx)(d,{...e})})]}),(0,m.jsxs)(s,{gap:2,children:[(0,m.jsx)(`h2`,{children:`Material Web Labs surfaces`}),(0,m.jsxs)(c,{gap:6,wrap:`wrap`,vAlign:`center`,children:[(0,m.jsx)(d,{label:`New activity`}),(0,m.jsx)(d,{value:0,label:`No unread items`}),(0,m.jsx)(d,{value:3,label:`3 unread items`}),(0,m.jsx)(d,{value:`99+`,label:`More than 99 unread items`})]})]}),(0,m.jsxs)(s,{gap:2,children:[(0,m.jsx)(`h2`,{children:`Anchored notification states`}),(0,m.jsx)(n,{type:`supporting`,children:`The caller owns badge placement and includes the notification state in the button name. The badge cannot intercept pointer input.`}),(0,m.jsxs)(c,{gap:6,wrap:`wrap`,vAlign:`center`,children:[(0,m.jsxs)(`span`,{className:`x1n2onr6 x3nfvp2 x6s0dn4 xl56j7k x1useyqa xsdox4t xkib98w`,children:[(0,m.jsx)(a,{icon:(0,m.jsx)(r,{icon:`menu`}),label:`Menu, new activity`,tooltip:`Menu`,variant:`ghost`}),(0,m.jsx)(d,{className:{className:`x10l6tqk x13vifvy xtijo5x`}.className})]}),(0,m.jsxs)(`span`,{className:`x1n2onr6 x3nfvp2 x6s0dn4 xl56j7k x1useyqa xsdox4t xkib98w`,children:[(0,m.jsx)(a,{icon:(0,m.jsx)(r,{icon:`menu`}),label:`Menu, 3 new items`,tooltip:`Menu`,variant:`ghost`}),(0,m.jsx)(d,{value:3,className:{className:`x10l6tqk x1fo6t33 xqwxbl3`}.className})]})]})]}),(0,m.jsxs)(s,{gap:2,xstyle:h.narrow,children:[(0,m.jsx)(`h2`,{children:`Narrow layout`}),(0,m.jsxs)(c,{gap:4,wrap:`wrap`,vAlign:`center`,children:[(0,m.jsx)(d,{}),(0,m.jsx)(d,{value:`99+`}),(0,m.jsx)(n,{type:`supporting`,children:`Notification count`})]})]})]})},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: 'Material 3 Review',
  globals: {
    astryxTheme: 'material3'
  },
  args: {
    value: 3,
    label: '3 notifications'
  },
  render: args => <VStack gap={6} xstyle={styles.gallery}>
      <VStack gap={2}>
        <h2>Interactive badge</h2>
        <Text type="supporting">
          Edit the value or accessible label in Controls. Clear the value for
          the 6px dot. Light, dark, and RTL are in the toolbar.
        </Text>
        <HStack>
          <MaterialBadge {...args} />
        </HStack>
      </VStack>
      <VStack gap={2}>
        <h2>Material Web Labs surfaces</h2>
        <HStack gap={6} wrap="wrap" vAlign="center">
          <MaterialBadge label="New activity" />
          <MaterialBadge value={0} label="No unread items" />
          <MaterialBadge value={3} label="3 unread items" />
          <MaterialBadge value="99+" label="More than 99 unread items" />
        </HStack>
      </VStack>
      <VStack gap={2}>
        <h2>Anchored notification states</h2>
        <Text type="supporting">
          The caller owns badge placement and includes the notification state in
          the button name. The badge cannot intercept pointer input.
        </Text>
        <HStack gap={6} wrap="wrap" vAlign="center">
          <span {...stylex.props(styles.anchor)}>
            <IconButton icon={<Icon icon="menu" />} label="Menu, new activity" tooltip="Menu" variant="ghost" />
            <MaterialBadge className={stylex.props(styles.dotOverlay).className} />
          </span>
          <span {...stylex.props(styles.anchor)}>
            <IconButton icon={<Icon icon="menu" />} label="Menu, 3 new items" tooltip="Menu" variant="ghost" />
            <MaterialBadge value={3} className={stylex.props(styles.countOverlay).className} />
          </span>
        </HStack>
      </VStack>
      <VStack gap={2} xstyle={styles.narrow}>
        <h2>Narrow layout</h2>
        <HStack gap={4} wrap="wrap" vAlign="center">
          <MaterialBadge />
          <MaterialBadge value="99+" />
          <Text type="supporting">Notification count</Text>
        </HStack>
      </VStack>
    </VStack>
}`,..._.parameters?.docs?.source}}},v=[`Material3Review`]}))();export{_ as Material3Review,v as __namedExportsOrder,g as default};