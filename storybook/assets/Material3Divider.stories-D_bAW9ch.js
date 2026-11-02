import{i as e}from"./preload-helper-CT_b8DTk.js";import{t}from"./jsx-runtime-DqZldVDK.js";import{t as n}from"./Text-BXEuttRu.js";import{t as r}from"./Divider-CDtpIPp0.js";import{t as i}from"./Divider-DrhiVXad.js";import{i as a,o}from"./Stack-CfnjGhmq.js";import{t as s}from"./Layout-B2hEnZFK.js";import{t as c}from"./Text-CRXEW_aT.js";var l,u,d,f,p;e((()=>{i(),s(),c(),l=t(),u={gallery:{ks0D6T:`x7ep2pv`,kmVPX3:`xggk2y7`,kg3NbH:null,kuDDbn:null,kE3dHu:null,kP0aTx:null,kpe85a:null,k8WAf4:null,kLKAdn:null,kGO01o:null,$$css:!0},vertical:{kZKoxP:`xjp8j0k`,$$css:!0},narrow:{kzqmXN:`x16grhtn`,ks0D6T:`x193iq5w`,$$css:!0}},d={title:`Material 3/Divider`,component:r,tags:[`autodocs`],argTypes:{inset:{control:`select`,options:[void 0,`both`,`start`,`end`]},isDecorative:{control:`boolean`},variant:{control:`select`,options:[`subtle`,`strong`]},label:{control:`text`}}},f={name:`Material 3 Review`,globals:{astryxTheme:`material3`},args:{isDecorative:!0,variant:`subtle`},render:e=>(0,l.jsxs)(a,{gap:6,xstyle:u.gallery,children:[(0,l.jsxs)(a,{gap:2,children:[(0,l.jsx)(`h2`,{children:`Interactive divider`}),(0,l.jsx)(n,{type:`supporting`,children:`Try insets, a meaningful separator, the strong Astryx extension, or a label in Controls. Light, dark, and RTL are in the toolbar.`}),(0,l.jsx)(`div`,{className:`x10dr8xq x1cupvez`,children:(0,l.jsx)(r,{...e})})]}),(0,l.jsxs)(a,{gap:3,children:[(0,l.jsx)(`h2`,{children:`Material Web variants`}),[[`Full width`,void 0],[`Inset both`,`both`],[`Inset start`,`start`],[`Inset end`,`end`]].map(([e,t])=>(0,l.jsxs)(a,{gap:1,children:[(0,l.jsx)(n,{type:`supporting`,children:e}),(0,l.jsx)(`div`,{className:`x10dr8xq x1cupvez`,children:(0,l.jsx)(r,{inset:t,isDecorative:!0})})]},e))]}),(0,l.jsxs)(a,{gap:2,children:[(0,l.jsx)(`h2`,{children:`Astryx extensions`}),(0,l.jsx)(n,{type:`supporting`,children:`Strong weight, visible labels, and vertical rules keep their Core behavior under this theme.`}),(0,l.jsx)(r,{variant:`strong`}),(0,l.jsx)(r,{label:`Section`}),(0,l.jsxs)(a,{gap:1,xstyle:u.narrow,children:[(0,l.jsx)(n,{type:`supporting`,children:`Narrow labelled divider`}),(0,l.jsx)(r,{label:`A long localized section label that may wrap`})]}),(0,l.jsxs)(o,{gap:3,vAlign:`center`,xstyle:u.vertical,children:[(0,l.jsx)(n,{type:`body`,children:`Start`}),(0,l.jsx)(r,{orientation:`vertical`}),(0,l.jsx)(n,{type:`body`,children:`End`})]})]})]})},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: 'Material 3 Review',
  globals: {
    astryxTheme: 'material3'
  },
  args: {
    isDecorative: true,
    variant: 'subtle'
  },
  render: args => <VStack gap={6} xstyle={styles.gallery}>
      <VStack gap={2}>
        <h2>Interactive divider</h2>
        <Text type="supporting">
          Try insets, a meaningful separator, the strong Astryx extension, or a
          label in Controls. Light, dark, and RTL are in the toolbar.
        </Text>
        <div {...stylex.props(styles.specimen)}>
          <Divider {...args} />
        </div>
      </VStack>
      <VStack gap={3}>
        <h2>Material Web variants</h2>
        {([['Full width', undefined], ['Inset both', 'both'], ['Inset start', 'start'], ['Inset end', 'end']] as const).map(([name, inset]) => <VStack key={name} gap={1}>
            <Text type="supporting">{name}</Text>
            <div {...stylex.props(styles.specimen)}>
              <Divider inset={inset} isDecorative />
            </div>
          </VStack>)}
      </VStack>
      <VStack gap={2}>
        <h2>Astryx extensions</h2>
        <Text type="supporting">
          Strong weight, visible labels, and vertical rules keep their Core
          behavior under this theme.
        </Text>
        <Divider variant="strong" />
        <Divider label="Section" />
        <VStack gap={1} xstyle={styles.narrow}>
          <Text type="supporting">Narrow labelled divider</Text>
          <Divider label="A long localized section label that may wrap" />
        </VStack>
        <HStack gap={3} vAlign="center" xstyle={styles.vertical}>
          <Text type="body">Start</Text>
          <Divider orientation="vertical" />
          <Text type="body">End</Text>
        </HStack>
      </VStack>
    </VStack>
}`,...f.parameters?.docs?.source}}},p=[`Material3Review`]}))();export{f as Material3Review,p as __namedExportsOrder,d as default};