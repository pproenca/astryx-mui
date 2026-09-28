import{i as e}from"./preload-helper-CT_b8DTk.js";import{t}from"./jsx-runtime-DqZldVDK.js";var n,r,i,a;e((()=>{n=t(),r={title:`Material 3/Native foundations`,tags:[`no-visual`],globals:{astryxTheme:`none`},parameters:{layout:`fullscreen`,docs:{description:{component:`The iframe runs the native Material 3 package. Source comparisons, the exact build revision, watched motion, and a native Icon preview are included.`}}}},i={render:(e,t)=>{let r=t.globals.colorMode===`dark`?`dark`:`light`,i=t.globals.direction===`rtl`?`rtl`:`ltr`,a=new URLSearchParams({scheme:r,direction:i});return(0,n.jsx)(`iframe`,{title:`Interactive native Material 3 foundation gallery`,src:`/material3-gallery/index.html?${a}`,style:{display:`block`,width:`100%`,minHeight:1100,border:0}},a.toString())}},i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: (_args, context) => {
    const scheme = context.globals.colorMode === 'dark' ? 'dark' : 'light';
    const direction = context.globals.direction === 'rtl' ? 'rtl' : 'ltr';
    const query = new URLSearchParams({
      scheme,
      direction
    });
    return <iframe key={query.toString()} title="Interactive native Material 3 foundation gallery" src={\`/material3-gallery/index.html?\${query}\`} style={{
      display: 'block',
      width: '100%',
      minHeight: 1100,
      border: 0
    }} />;
  }
}`,...i.parameters?.docs?.source}}},a=[`Gallery`]}))();export{i as Gallery,a as __namedExportsOrder,r as default};