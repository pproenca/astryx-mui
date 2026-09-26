import{i as e}from"./preload-helper-CT_b8DTk.js";import{t}from"./react-B7Te67-h.js";import{F as n,I as r}from"./ime-B2gVvZm0.js";import{t as i}from"./jsx-runtime-DqZldVDK.js";import{t as a}from"./Text-BXEuttRu.js";import{i as o,o as s}from"./Stack-CfnjGhmq.js";import{t as c}from"./Layout-B2hEnZFK.js";import{t as l}from"./Text-CRXEW_aT.js";function u(e,t,n,r){if(t!==void 0&&(!Number.isFinite(t)||t<n||t>r))throw RangeError(`${e} must be a finite number from ${n} to ${r}.`)}function d({name:e,variant:t=`outlined`,size:n,fill:i,weight:a,grade:o,opticalSize:s,label:c,className:l,ref:d,...p}){if(!e)throw Error(`MaterialSymbol name must be a nonempty ligature or codepoint.`);if(n!==void 0&&(!Number.isFinite(n)||n<=0))throw RangeError(`MaterialSymbol size must be a positive finite number.`);u(`fill`,i,0,1),u(`weight`,a,100,700),u(`grade`,o,-50,200),u(`opticalSize`,s,20,48);let h=[i,a,o,s].some(e=>e!==void 0)?`"FILL" ${i??0}, "wght" ${a??400}, "GRAD" ${o??0}, "opsz" ${s??24}`:null,g=r(m.root,t===`rounded`&&m.rounded,t===`sharp`&&m.sharp,n!==void 0&&m.size(n),h!==null&&m.axes(h)),_=c?{role:`img`,"aria-label":c}:{"aria-hidden":!0};return(0,f.jsx)(`span`,{...g,..._,...p,className:[g.className,l].filter(Boolean).join(` `),ref:d,children:e})}var f,p,m,h=e((()=>{t(),n(),f=i(),p={kzqmXN:`astryx5lhr3w`,kZKoxP:`astryx16ye13r`,kGuDYH:`astryxdmh292`,$$css:!0},m={root:{k1xSpc:`astryx3nfvp2`,kGNEyG:`astryx6s0dn4`,kjj79g:`astryxl56j7k`,kzqmXN:`astryx1nn0934`,kZKoxP:`astryxunig1n`,kGuDYH:`astryx1vh5iee`,kMv6JI:`astryx13z5l6r`,kV0H8L:`astryx1y5z1qm`,k63SB2:`astryxo1l8bm`,kKX8nH:`astryx1j61x8r`,kHiXq7:`astryx1ic7a3i`,kLWn49:`astryxo5v014`,kb6lSQ:`astryx1i21sxh`,kP9fke:`astryx6mezaz`,khDVqt:`astryxuxw1ft`,kD5eJx:`astryxp5j34i`,kfSwDN:`astryx87ps6o`,kVQacm:`astryxb3r6kr`,kmuXW:`astryx2lah0s`,$$css:!0},rounded:{kMv6JI:`astryxlxoekd`,$$css:!0},sharp:{kMv6JI:`astryxbfu3gm`,$$css:!0},size:e=>[p,{"--x-width":(e=>typeof e==`number`?e+`px`:e??void 0)(`${e}px`),"--x-height":(e=>typeof e==`number`?e+`px`:e??void 0)(`${e}px`),"--x-fontSize":(e=>typeof e==`number`?e+`px`:e??void 0)(`${e}px`)}],axes:e=>[{ka26j:e==null?e:`astryx12fgrxt`,$$css:!0},{"--x-fontVariationSettings":e??void 0}]},d.__docgenInfo={description:`Renders one glyph from a consumer-loaded Material Symbols font.

@example
\`\`\`
<MaterialSymbol name="settings" label="Settings" />
<MaterialSymbol name="home" variant="rounded" fill={1} weight={500} />
\`\`\``,methods:[],displayName:`MaterialSymbol`,props:{name:{required:!0,tsType:{name:`string`},description:`Material Symbols ligature (such as "settings") or Unicode codepoint.`},variant:{required:!1,tsType:{name:`union`,raw:`'outlined' | 'rounded' | 'sharp'`,elements:[{name:`literal`,value:`'outlined'`},{name:`literal`,value:`'rounded'`},{name:`literal`,value:`'sharp'`}]},description:`Font family style. @default 'outlined'`,defaultValue:{value:`'outlined'`,computed:!1}},size:{required:!1,tsType:{name:`number`},description:`Square icon size in CSS pixels. Omit to use --md-icon-size or 24px.`},fill:{required:!1,tsType:{name:`number`},description:`FILL axis, from 0 (outline) to 1 (filled).`},weight:{required:!1,tsType:{name:`number`},description:`wght axis, from 100 to 700.`},grade:{required:!1,tsType:{name:`number`},description:`GRAD axis, from -50 to 200.`},opticalSize:{required:!1,tsType:{name:`number`},description:`opsz axis, from 20 to 48.`},label:{required:!1,tsType:{name:`string`},description:`Accessible name for a meaningful standalone symbol. Omit for decoration.`},ref:{required:!1,tsType:{name:`Ref`,elements:[{name:`HTMLSpanElement`}],raw:`Ref<HTMLSpanElement>`},description:`Ref forwarded to the span.`}},composes:[`Omit`]}})),g,_,v,y,b;e((()=>{h(),c(),l(),g=i(),_=`https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL,GRAD,opsz,wght@0..1,-50..200,20..48,100..700&family=Material+Symbols+Rounded:FILL,GRAD,opsz,wght@0..1,-50..200,20..48,100..700&family=Material+Symbols+Sharp:FILL,GRAD,opsz,wght@0..1,-50..200,20..48,100..700&display=block`,v={title:`Material 3/MaterialSymbol`,component:d,tags:[`autodocs`],argTypes:{variant:{control:`select`,options:[`outlined`,`rounded`,`sharp`]},fill:{control:{type:`range`,min:0,max:1,step:.1}},weight:{control:{type:`range`,min:100,max:700,step:100}},grade:{control:{type:`range`,min:-50,max:200,step:25}},opticalSize:{control:{type:`range`,min:20,max:48,step:4}}}},y={name:`Material 3 Review`,globals:{astryxTheme:`material3`},args:{name:`settings`,variant:`outlined`,label:`Settings`,size:24,fill:0,weight:400,grade:0,opticalSize:24},render:e=>(0,g.jsxs)(o,{gap:6,children:[(0,g.jsx)(`link`,{rel:`stylesheet`,href:_}),(0,g.jsxs)(o,{gap:2,children:[(0,g.jsx)(`h2`,{children:`Interactive Material Symbol`}),(0,g.jsx)(d,{...e}),(0,g.jsx)(a,{type:`supporting`,children:`Try a ligature, family, exact size, or any font axis in Controls. The app loads the font from Google Fonts for this preview.`})]}),(0,g.jsxs)(o,{gap:2,children:[(0,g.jsx)(`h2`,{children:`Font families and codepoint`}),(0,g.jsxs)(s,{gap:6,wrap:`wrap`,vAlign:`center`,children:[[`outlined`,`rounded`,`sharp`].map(e=>(0,g.jsxs)(o,{gap:1,hAlign:`center`,children:[(0,g.jsx)(d,{name:`favorite`,variant:e,size:32}),(0,g.jsx)(a,{type:`supporting`,children:e})]},e)),(0,g.jsxs)(o,{gap:1,hAlign:`center`,children:[(0,g.jsx)(d,{name:``,label:`Favorite`,size:32}),(0,g.jsx)(a,{type:`supporting`,children:`Codepoint`})]})]})]}),(0,g.jsxs)(o,{gap:2,children:[(0,g.jsx)(`h2`,{children:`Size and variable axes`}),(0,g.jsxs)(s,{gap:6,wrap:`wrap`,vAlign:`center`,children:[(0,g.jsx)(d,{name:`home`}),(0,g.jsx)(d,{name:`home`,size:20}),(0,g.jsx)(d,{name:`home`,size:32}),(0,g.jsx)(d,{name:`home`,size:48}),(0,g.jsx)(d,{name:`home`,size:32,fill:1,weight:700,grade:200,opticalSize:48})]}),(0,g.jsx)(a,{type:`supporting`,children:`Default 24px, explicit 20/32/48px, then a filled heavy grade profile.`})]})]})},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: 'Material 3 Review',
  globals: {
    astryxTheme: 'material3'
  },
  args: {
    name: 'settings',
    variant: 'outlined',
    label: 'Settings',
    size: 24,
    fill: 0,
    weight: 400,
    grade: 0,
    opticalSize: 24
  },
  render: args => <VStack gap={6}>
      <link rel="stylesheet" href={fontStylesheet} />
      <VStack gap={2}>
        <h2>Interactive Material Symbol</h2>
        <MaterialSymbol {...args} />
        <Text type="supporting">
          Try a ligature, family, exact size, or any font axis in Controls. The
          app loads the font from Google Fonts for this preview.
        </Text>
      </VStack>
      <VStack gap={2}>
        <h2>Font families and codepoint</h2>
        <HStack gap={6} wrap="wrap" vAlign="center">
          {(['outlined', 'rounded', 'sharp'] as const).map(variant => <VStack key={variant} gap={1} hAlign="center">
              <MaterialSymbol name="favorite" variant={variant} size={32} />
              <Text type="supporting">{variant}</Text>
            </VStack>)}
          <VStack gap={1} hAlign="center">
            <MaterialSymbol name={'\\ue87d'} label="Favorite" size={32} />
            <Text type="supporting">Codepoint</Text>
          </VStack>
        </HStack>
      </VStack>
      <VStack gap={2}>
        <h2>Size and variable axes</h2>
        <HStack gap={6} wrap="wrap" vAlign="center">
          <MaterialSymbol name="home" />
          <MaterialSymbol name="home" size={20} />
          <MaterialSymbol name="home" size={32} />
          <MaterialSymbol name="home" size={48} />
          <MaterialSymbol name="home" size={32} fill={1} weight={700} grade={200} opticalSize={48} />
        </HStack>
        <Text type="supporting">
          Default 24px, explicit 20/32/48px, then a filled heavy grade profile.
        </Text>
      </VStack>
    </VStack>
}`,...y.parameters?.docs?.source}}},b=[`Material3Review`]}))();export{y as Material3Review,b as __namedExportsOrder,v as default};