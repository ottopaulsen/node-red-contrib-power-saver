import{m as p,o as i,d as l,f as e,q as s,s as r,F as c,x as a,l as n}from"./app.ee0bf03b.js";import{_ as u}from"./node-ps-receive-price.dbc5e137.js";import{_ as d}from"./plugin-vue_export-helper.21dcd24c.js";const b={},h=a('<h1 id="ps-receive-price" tabindex="-1"><a class="header-anchor" href="#ps-receive-price" aria-hidden="true">#</a> ps-receive-price</h1><p><img src="'+u+'" alt="ps-receive-price"></p><h2 id="description" tabindex="-1"><a class="header-anchor" href="#description" aria-hidden="true">#</a> Description</h2><p>The <code>ps-receive-price</code> node is used to convert prices from Tibber or Nord Pool to the format used by the strategy nodes. It takes its input directly from the output of the following nodes (see details below):</p><ul><li><code>tibber-query</code> node from Tibber (<code>node-red-contrib-tibber-api</code>)</li><li><code>current state</code> node in Home Assistant</li><li><code>events: state</code> node in Home Assistant</li></ul><p>Output can be sent directly to the strategy nodes (for example <code>strategy-best-save</code> or <code>strategy-lowest-price</code>), or it can be sent via another node to add grid tariff or other additional costs before the calculation is done.</p><div class="custom-container warning"><p class="custom-container-title">Note</p><p>In version 2 of <code>node-red-contrib-power-saver</code>, prices were received directly by the Power Saver node. This made it hard to add grid tariff before the calculation was done. That is why this is now a separate node.</p></div><h2 id="configuration" tabindex="-1"><a class="header-anchor" href="#configuration" aria-hidden="true">#</a> Configuration</h2><p>There is no configuration except from node name.</p><h2 id="input" tabindex="-1"><a class="header-anchor" href="#input" aria-hidden="true">#</a> Input</h2><h3 id="tibber-input" tabindex="-1"><a class="header-anchor" href="#tibber-input" aria-hidden="true">#</a> Tibber input</h3>',11),m=n("If you are a Tibber customer, you can use the "),_=e("code",null,"tibber-query",-1),f=n(" node from the "),y={href:"https://flows.nodered.org/node/node-red-contrib-tibber-api",target:"_blank",rel:"noopener noreferrer"},g=e("code",null,"node-red-contrib-tibber-api",-1),v=n(". Set it up with the following query:"),k=a(`<div class="language-gql ext-gql line-numbers-mode"><pre class="language-gql"><code>{
  viewer {
    homes {
      currentSubscription {
        priceInfo {
          today {
            total
            startsAt
          }
          tomorrow {
            total
            startsAt
          }
        }
      }
    }
  }
}
</code></pre><div class="line-numbers" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br></div></div><p>Send the result from the <code>tibber-query</code> node with the query above directly to the <code>ps-receive-price</code> node. Make sure it is refreshed when new prices are ready. Prices for the next day are normally ready at 13:00, but refreshing every hour can be a good idea.</p>`,2),q=n("See example with Tibber, a switch and MQTT"),w=e("div",{class:"custom-container danger"},[e("p",{class:"custom-container-title"},"Warning"),e("p",null,"The query above returns an array with all houses you have in your Tibber account. It will work only if the house you want is the first house in the array, for example if you have only one house. If that is not the case, you must use the query below.")],-1),x=e("p",null,[e("strong",null,"Tibber query for a specific house")],-1),T=e("p",null,"If the above query does not give you the house you want as the first in the result array, you can use the following method. In this method you need run one query in order to find the id of the house you want the prices for first, and then use the id in the real query.",-1),I=n("Go to the "),N={href:"https://developer.tibber.com/",target:"_blank",rel:"noopener noreferrer"},P=n("Tibber Developer pages"),S=n(", sign in, and go to the "),A={href:"https://developer.tibber.com/explorer",target:"_blank",rel:"noopener noreferrer"},L=n("API Explorer"),O=n(". Load your personal token, then run the following query:"),j=a(`<div class="language-gql ext-gql line-numbers-mode"><pre class="language-gql"><code>{
  viewer {
    homes {
      id
      address {
        address1
        address2
        address3
        postalCode
        city
        country
      }
    }
  }
}
</code></pre><div class="line-numbers" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br></div></div><p>Then copy the <code>id</code> of the house you want to use prices for. It may look like this:</p><div class="language-text ext-text line-numbers-mode"><pre class="language-text"><code>NB! This is just an example:
142c1670-ab43-2ab3-ba6d-723703a551e2
</code></pre><div class="line-numbers" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br></div></div><p>Then use the id in the following query, replacing the id with the one you found in the previous query:</p><div class="language-gql ext-gql line-numbers-mode"><pre class="language-gql"><code>{
  viewer {
    home(id: &quot;142c1670-ab43-2ab3-ba6d-723703a551e2&quot;) {
      currentSubscription{
        priceInfo{
          today {
            total
            startsAt
          }
          tomorrow {
            total
            startsAt
          }
        }
      }
    }
  }
}
</code></pre><div class="highlight-lines"><br><br><div class="highlight-line">\xA0</div><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br></div><div class="line-numbers" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br></div></div><p>This is the query you shall put in the <code>tibber-query</code> node.</p><h3 id="nord-pool-input" tabindex="-1"><a class="header-anchor" href="#nord-pool-input" aria-hidden="true">#</a> Nord Pool input</h3>`,7),B=n("This is especially designed to work for Home Assistant (HA), and the "),C={href:"https://github.com/custom-components/nordpool",target:"_blank",rel:"noopener noreferrer"},E=n("Nord Pool custom component"),H=n(". The Nord Pool component provides a "),V=e("em",null,"sensor",-1),D=n(" that gives price per hour for today and tomorrow (after 13:00). Send the output from this sensor directly to the "),M=e("code",null,"ps-receive-price",-1),R=n(" node. Make sure this is done whenever the node is updated, as well as when the system starts up."),F=a('<p>Data can be sent from both the <code>current state</code> node or the <code>events: state</code> node.</p><div class="custom-container tip"><p class="custom-container-title">Output properties</p><p>When using the <code>current state</code> node, configure the output properties to set <code>msg.payload</code> to <code>entity</code>.</p></div>',2),W=n("See example with Nord Pool and "),G=e("code",null,"current state",-1),J=n(" node"),Q=n("See example with Nord Pool and "),z=e("code",null,"events: state",-1),K=n(" node"),U=a(`<h3 id="other-input" tabindex="-1"><a class="header-anchor" href="#other-input" aria-hidden="true">#</a> Other input</h3><p>If you cannot use any of the two above (Tibber or Nord Pool), create the input to the node with the payload containing JSON like this:</p><div class="language-json ext-json line-numbers-mode"><pre class="language-json"><code><span class="token punctuation">{</span>
  <span class="token property">&quot;today&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
    <span class="token punctuation">{</span> <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token property">&quot;start&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2021-06-21T00:00:00+02:00&quot;</span> <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span> <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token number">2</span><span class="token punctuation">,</span> <span class="token property">&quot;start&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2021-06-21T01:00:00+02:00&quot;</span> <span class="token punctuation">}</span>
    <span class="token comment">//...</span>
  <span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token property">&quot;tomorrow&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
    <span class="token punctuation">{</span> <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token number">3</span><span class="token punctuation">,</span> <span class="token property">&quot;start&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2021-06-22T00:00:00+02:00&quot;</span> <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span> <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token number">4</span><span class="token punctuation">,</span> <span class="token property">&quot;start&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2021-06-22T01:00:00+02:00&quot;</span> <span class="token punctuation">}</span>
    <span class="token comment">//...</span>
  <span class="token punctuation">]</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br></div></div><h2 id="output" tabindex="-1"><a class="header-anchor" href="#output" aria-hidden="true">#</a> Output</h2>`,4),X=n("The output is the "),Y=n("common strategy input format"),Z=n(", so it can be sent directly to the strategy nodes, or via any "),$=e("code",null,"ps-xxx-add-tariff",-1),ee=n(" node.");function ne(se,ae){const t=p("ExternalLinkIcon"),o=p("RouterLink");return i(),l(c,null,[h,e("p",null,[m,_,f,e("a",y,[g,s(t)]),v]),k,e("p",null,[s(o,{to:"/examples/example-tibber-mqtt.html"},{default:r(()=>[q]),_:1})]),w,x,T,e("p",null,[I,e("a",N,[P,s(t)]),S,e("a",A,[L,s(t)]),O]),j,e("p",null,[B,e("a",C,[E,s(t)]),H,V,D,M,R]),F,e("p",null,[s(o,{to:"/examples/example-nordpool-current-state.html"},{default:r(()=>[W,G,J]),_:1})]),e("p",null,[s(o,{to:"/examples/example-nordpool-events-state.html"},{default:r(()=>[Q,z,K]),_:1})]),U,e("p",null,[X,s(o,{to:"/nodes/strategy-input.html"},{default:r(()=>[Y]),_:1}),Z,$,ee])],64)}var pe=d(b,[["render",ne]]);export{pe as default};
