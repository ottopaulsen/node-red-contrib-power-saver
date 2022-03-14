import{m as r,o as t,d as a,f as e,q as s,F as d,l as i,x as n}from"./app.ee0bf03b.js";import{_ as c}from"./node-power-saver.3a115c24.js";import{_ as p}from"./migrate-best-save.dcc20d06.js";import{_ as m}from"./plugin-vue_export-helper.21dcd24c.js";var h="/assets/migrate-power-saver.98ee9f2e.png";const _={},v={id:"power-saver",tabindex:"-1"},l=e("a",{class:"header-anchor",href:"#power-saver","aria-hidden":"true"},"#",-1),f=i(" power-saver "),w=n('<p><img src="'+c+'" alt="Power Saver node"></p><p>This is the node from version 2. It is still working, but should be replaced.</p><p>To migrate, just replace the Power Saver node by a combination of the ps-receive-price and the ps-best-save nodes:</p><p>Replace the <code>Power Saver</code> node from version 2:</p><p><img src="'+h+'" alt="Power Saver node"></p><p>with this combination of <code>ps-receive-price</code> and <code>ps-strategy-best-save</code> from version 3:</p><p><img src="'+p+'" alt="Migrate Power Saver"></p><p>The configuration is done in the <code>ps-strategy-best-save</code> node, and is the same as in the old <code>Power Saver</code> node.</p><p>Should you need it, here is the <a href="./old-power-saver-doc">old documentation</a> for the PowerSaver node from version 2.</p>',9);function g(u,S){const o=r("Badge");return t(),a(d,null,[e("h1",v,[l,f,s(o,{type:"warning",text:"deprecated",vertical:"middle"})]),w],64)}var B=m(_,[["render",g]]);export{B as default};
