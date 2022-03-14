import{x as n}from"./app.ee0bf03b.js";import{_ as s}from"./plugin-vue_export-helper.21dcd24c.js";var a="/assets/power-saver-nordpool-current-state.cbe8e48a.png";const t={},p=n('<h1 id="nord-pool-and-current-state-node" tabindex="-1"><a class="header-anchor" href="#nord-pool-and-current-state-node" aria-hidden="true">#</a> Nord Pool and current state node</h1><h2 id="description" tabindex="-1"><a class="header-anchor" href="#description" aria-hidden="true">#</a> Description</h2><p>In this example, data is read from the Nord Pool sensor in HA via the <code>current state</code> node. The <code>ps-best-save</code> node is used to control a water heater via a switch, controlled by <code>call service</code> nodes in Home Assistant. The schedule is printed to a debug node. An <code>inject</code> node is used to trigger the reading of the Nord Pool sensor every hour.</p><p><img src="'+a+`" alt="Example with Tibber and MQTT"></p><h2 id="flow" tabindex="-1"><a class="header-anchor" href="#flow" aria-hidden="true">#</a> Flow</h2><div class="language-json ext-json"><pre class="language-json"><code><span class="token punctuation">[</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;e2578f6a.210a8&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;debug&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Nord Pool result&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;active&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;tosidebar&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;console&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;tostatus&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;complete&quot;</span><span class="token operator">:</span> <span class="token string">&quot;true&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;targetType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;full&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;statusVal&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;statusType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;auto&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">820</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">440</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;48bcdcca.fe42a4&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;api-current-state&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Read Nord Pool&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;server&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ec4a12a1.b2be9&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;version&quot;</span><span class="token operator">:</span> <span class="token number">2</span><span class="token punctuation">,</span>
        <span class="token property">&quot;outputs&quot;</span><span class="token operator">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
        <span class="token property">&quot;halt_if&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;halt_if_type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;str&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;halt_if_compare&quot;</span><span class="token operator">:</span> <span class="token string">&quot;is&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;entity_id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;sensor.nordpool_kwh_trheim_nok_3_095_025&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;state_type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;str&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;blockInputOverrides&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;outputProperties&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">{</span>
                <span class="token property">&quot;property&quot;</span><span class="token operator">:</span> <span class="token string">&quot;payload&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;propertyType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;msg&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;valueType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;entity&quot;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">]</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">280</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">380</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">[</span>
                <span class="token string">&quot;428d7c7ca88db95f&quot;</span>
            <span class="token punctuation">]</span>
        <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;97cc8e58.4247a&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;inject&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;props&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">{</span>
                <span class="token property">&quot;p&quot;</span><span class="token operator">:</span> <span class="token string">&quot;payload&quot;</span>
            <span class="token punctuation">}</span><span class="token punctuation">,</span>
            <span class="token punctuation">{</span>
                <span class="token property">&quot;p&quot;</span><span class="token operator">:</span> <span class="token string">&quot;topic&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;vt&quot;</span><span class="token operator">:</span> <span class="token string">&quot;str&quot;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">]</span><span class="token punctuation">,</span>
        <span class="token property">&quot;repeat&quot;</span><span class="token operator">:</span> <span class="token string">&quot;3600&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;crontab&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;once&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;onceDelay&quot;</span><span class="token operator">:</span> <span class="token number">0.1</span><span class="token punctuation">,</span>
        <span class="token property">&quot;topic&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;payloadType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;date&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">110</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">380</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">[</span>
                <span class="token string">&quot;48bcdcca.fe42a4&quot;</span>
            <span class="token punctuation">]</span>
        <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;a6f2769b.1a62a8&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;api-call-service&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Turn on VVB&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;server&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ec4a12a1.b2be9&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;version&quot;</span><span class="token operator">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
        <span class="token property">&quot;debugenabled&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;service_domain&quot;</span><span class="token operator">:</span> <span class="token string">&quot;switch&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;service&quot;</span><span class="token operator">:</span> <span class="token string">&quot;turn_on&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;entityId&quot;</span><span class="token operator">:</span> <span class="token string">&quot;switch.varmtvannsbereder_switch&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;data&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;dataType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;jsonata&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;mergecontext&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;mustacheAltTags&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;outputProperties&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
        <span class="token property">&quot;queue&quot;</span><span class="token operator">:</span> <span class="token string">&quot;none&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">810</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">340</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">[</span><span class="token punctuation">]</span>
        <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;9fc75126.65dd3&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;api-call-service&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Turn off VVB&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;server&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ec4a12a1.b2be9&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;version&quot;</span><span class="token operator">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
        <span class="token property">&quot;debugenabled&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;service_domain&quot;</span><span class="token operator">:</span> <span class="token string">&quot;switch&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;service&quot;</span><span class="token operator">:</span> <span class="token string">&quot;turn_off&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;entityId&quot;</span><span class="token operator">:</span> <span class="token string">&quot;switch.varmtvannsbereder_switch&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;data&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;dataType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;json&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;mergecontext&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;mustacheAltTags&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;outputProperties&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
        <span class="token property">&quot;queue&quot;</span><span class="token operator">:</span> <span class="token string">&quot;none&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">810</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">380</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">[</span><span class="token punctuation">]</span>
        <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;428d7c7ca88db95f&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ps-receive-price&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Price Receiver&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">460</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">380</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">[</span>
                <span class="token string">&quot;4147bf0b99fe626f&quot;</span>
            <span class="token punctuation">]</span>
        <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;4147bf0b99fe626f&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ps-strategy-best-save&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d938c47f.3398f8&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Best Save&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;maxHoursToSaveInSequence&quot;</span><span class="token operator">:</span> <span class="token string">&quot;4&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;minHoursOnAfterMaxSequenceSaved&quot;</span><span class="token operator">:</span> <span class="token string">&quot;1&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;minSaving&quot;</span><span class="token operator">:</span> <span class="token string">&quot;0.03&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;sendCurrentValueWhenRescheduling&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;outputIfNoSchedule&quot;</span><span class="token operator">:</span> <span class="token string">&quot;true&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">630</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">380</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">[</span>
                <span class="token string">&quot;a6f2769b.1a62a8&quot;</span>
            <span class="token punctuation">]</span><span class="token punctuation">,</span>
            <span class="token punctuation">[</span>
                <span class="token string">&quot;9fc75126.65dd3&quot;</span>
            <span class="token punctuation">]</span><span class="token punctuation">,</span>
            <span class="token punctuation">[</span>
                <span class="token string">&quot;e2578f6a.210a8&quot;</span>
            <span class="token punctuation">]</span>
        <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ec4a12a1.b2be9&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;server&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Home Assistant&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;version&quot;</span><span class="token operator">:</span> <span class="token number">2</span><span class="token punctuation">,</span>
        <span class="token property">&quot;addon&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;rejectUnauthorizedCerts&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;ha_boolean&quot;</span><span class="token operator">:</span> <span class="token string">&quot;y|yes|true|on|home|open&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;connectionDelay&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;cacheJson&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;heartbeat&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;heartbeatInterval&quot;</span><span class="token operator">:</span> <span class="token number">30</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">]</span>
</code></pre></div>`,6);function o(e,u){return p}var l=s(t,[["render",o]]);export{l as default};
