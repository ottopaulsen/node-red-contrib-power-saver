import{x as n}from"./app.ee0bf03b.js";import{_ as s}from"./plugin-vue_export-helper.21dcd24c.js";const a={},p=n(`<h1 id="strategy-input-format" tabindex="-1"><a class="header-anchor" href="#strategy-input-format" aria-hidden="true">#</a> Strategy input format</h1><p>The common input for strategy nodes is a payload with a <code>priceData</code> array containing an object for each hour. Each object has a <code>value</code> which is the price, and a <code>start</code> which is the start time for the hour.</p><p>Example:</p><div class="language-json ext-json line-numbers-mode"><pre class="language-json"><code><span class="token punctuation">{</span>
  <span class="token property">&quot;priceData&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
    <span class="token punctuation">{</span>
      <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token number">0.9544</span><span class="token punctuation">,</span>
      <span class="token property">&quot;start&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2021-12-07T00:00:00.000+01:00&quot;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
      <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token number">0.8973</span><span class="token punctuation">,</span>
      <span class="token property">&quot;start&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2021-12-07T01:00:00.000+01:00&quot;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
      <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token number">0.8668</span><span class="token punctuation">,</span>
      <span class="token property">&quot;start&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2021-12-07T02:00:00.000+01:00&quot;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
      <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token number">0.8683</span><span class="token punctuation">,</span>
      <span class="token property">&quot;start&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2021-12-07T03:00:00.000+01:00&quot;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
      <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token number">0.8942</span><span class="token punctuation">,</span>
      <span class="token property">&quot;start&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2021-12-07T04:00:00.000+01:00&quot;</span>
    <span class="token punctuation">}</span>
    <span class="token comment">// ... normally 24 or 48 hours</span>
  <span class="token punctuation">]</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br></div></div><p>This format is used for:</p><ul><li>Output of the <code>ps-receive-price</code> node</li><li>Input and output of the <code>ps-xxx-add-tariff</code> nodes</li><li>Input for the strategy nodes (<code>ps-strategy-xxx-xxx</code>)</li></ul>`,6);function t(e,o){return p}var u=s(a,[["render",t]]);export{u as default};
