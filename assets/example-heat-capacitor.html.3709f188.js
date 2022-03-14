import{m as p,o,d as e,f as s,q as u,s as c,F as r,x as a,l as n}from"./app.ee0bf03b.js";import{_ as l,a as k}from"./node-ps-strategy-heat-capacitor-simple-flow-example.099aa155.js";import{_ as i}from"./plugin-vue_export-helper.21dcd24c.js";const q={},y=a('<h1 id="simple-heat-capacitor-strategy-flow" tabindex="-1"><a class="header-anchor" href="#simple-heat-capacitor-strategy-flow" aria-hidden="true">#</a> Simple heat capacitor strategy flow</h1><h2 id="description" tabindex="-1"><a class="header-anchor" href="#description" aria-hidden="true">#</a> Description</h2><p>The heat capacitor strategy utilizes a large body of mass, like your house or cabin, to procure heat at a time where electricity is cheap, and divest at a time where electricity is expensive.</p><p>This is achieved by increasing the temperature setpoint of one or several climate entities at times when electricity is cheap, and reducing it when electricity is expensive.</p><p>It is a good application for cabins/heated storage spaces, as the entity never actually shuts off the climate entities and should therefore be rather safe to apply (still at you own risk \u{1F603}). It can also be used for you house, jacuzzi, and/or pool.</p><p><img src="'+l+'" alt="Temperature profile vs. cost"></p><hr><h2 id="requirements" tabindex="-1"><a class="header-anchor" href="#requirements" aria-hidden="true">#</a> Requirements</h2><blockquote><p>Home assistant integrated with Node-RED</p></blockquote><blockquote><p>Tibber node installed and correctly configured</p></blockquote><blockquote><p>A climate entity</p></blockquote><h2 id="instructions" tabindex="-1"><a class="header-anchor" href="#instructions" aria-hidden="true">#</a> Instructions</h2><blockquote><p>Create an <code>input_number</code> entity in Home Assistant named <code>setpoint</code></p></blockquote><blockquote><p>Import the flow into Node-RED</p></blockquote><blockquote><p>Configure the heat-capacitor node:</p></blockquote><ul><li>Insert an approximate time it takes to increase the temperature by 1 Centigrade (could be 90 minutes)</li><li>Insert an approximate time it takes to decrease 1 Centigrade</li><li>Insert minimum savings for a heating/cooling cycle (should not be zero, as a cycle might have a cost)</li></ul><blockquote><p>Configure the climate service to target the correct climate entity (this has to be edited in two places)</p></blockquote><ul><li>Change <code>Entity Id</code> in the properties menu</li><li>Change the <code>entity_id</code> value in the <code>Data</code> property</li></ul><blockquote><p>(optional) If the <code>input_number</code> entity was named something else than <code>setpoint</code>, change the <code>entity_id</code> of the <code>Setpoint</code> node accordingly.</p></blockquote><h3 id="advanced-set-up" tabindex="-1"><a class="header-anchor" href="#advanced-set-up" aria-hidden="true">#</a> Advanced set-up</h3>',20),d=n("Replace the "),g=s("code",null,"Set temperature",-1),m=n(" node with a "),b=n("Cascade controller"),h=n(" to improve the heaters accuracy and response time."),f=a('<hr><h2 id="flow" tabindex="-1"><a class="header-anchor" href="#flow" aria-hidden="true">#</a> Flow</h2><p><img src="'+k+`" alt="Simple example with Tibber"></p><hr><details class="custom-container details"><summary>[Flow code]</summary><div class="language-json ext-json"><pre class="language-json"><code><span class="token punctuation">[</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;135c4e7649611314&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;tab&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;label&quot;</span><span class="token operator">:</span> <span class="token string">&quot;PowerSaver&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;disabled&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;info&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;env&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;cf5908a52e0aee5e&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ps-receive-price&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;135c4e7649611314&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Price Receiver&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">400</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">320</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">[</span>
                <span class="token string">&quot;b7b85590b7d28ba6&quot;</span>
            <span class="token punctuation">]</span>
        <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;b08bc12bf8734c5a&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;tibber-query&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;135c4e7649611314&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;active&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;apiEndpointRef&quot;</span><span class="token operator">:</span> <span class="token string">&quot;9ea07b03b88cb526&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">230</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">320</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">[</span>
                <span class="token string">&quot;cf5908a52e0aee5e&quot;</span>
            <span class="token punctuation">]</span>
        <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;d0d4dd31efe67e85&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;inject&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;135c4e7649611314&quot;</span><span class="token punctuation">,</span>
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
        <span class="token property">&quot;repeat&quot;</span><span class="token operator">:</span> <span class="token string">&quot;60&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;crontab&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;once&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;onceDelay&quot;</span><span class="token operator">:</span> <span class="token string">&quot;1&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;topic&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;payload&quot;</span><span class="token operator">:</span> <span class="token string">&quot;{   viewer {     homes {       currentSubscription {         priceInfo {           today {             total             startsAt           }           tomorrow {             total             startsAt           }         }       }     }   } }&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;payloadType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;str&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">90</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">320</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">[</span>
                <span class="token string">&quot;b08bc12bf8734c5a&quot;</span>
            <span class="token punctuation">]</span>
        <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;4831f393a0066565&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;api-call-service&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;135c4e7649611314&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Set temperature&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;server&quot;</span><span class="token operator">:</span> <span class="token string">&quot;e2dd69fb.8f70a8&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;version&quot;</span><span class="token operator">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
        <span class="token property">&quot;debugenabled&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;service_domain&quot;</span><span class="token operator">:</span> <span class="token string">&quot;climate&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;service&quot;</span><span class="token operator">:</span> <span class="token string">&quot;set_temperature&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;entityId&quot;</span><span class="token operator">:</span> <span class="token string">&quot;climate.my_climate&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;data&quot;</span><span class="token operator">:</span> <span class="token string">&quot;{\\&quot;entity_id\\&quot;:\\&quot;climate.my_climate\\&quot;,\\&quot;temperature\\&quot;:\\&quot;{{adj_setpoint}}\\&quot;}&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;dataType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;json&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;mergecontext&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;mustacheAltTags&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;outputProperties&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
        <span class="token property">&quot;queue&quot;</span><span class="token operator">:</span> <span class="token string">&quot;none&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">980</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">320</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">[</span><span class="token punctuation">]</span>
        <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;027f4267d969e1b8&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;server-state-changed&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;135c4e7649611314&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Setpoint&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;server&quot;</span><span class="token operator">:</span> <span class="token string">&quot;e2dd69fb.8f70a8&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;version&quot;</span><span class="token operator">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
        <span class="token property">&quot;exposeToHomeAssistant&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;haConfig&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">{</span>
                <span class="token property">&quot;property&quot;</span><span class="token operator">:</span> <span class="token string">&quot;name&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span>
            <span class="token punctuation">}</span><span class="token punctuation">,</span>
            <span class="token punctuation">{</span>
                <span class="token property">&quot;property&quot;</span><span class="token operator">:</span> <span class="token string">&quot;icon&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">]</span><span class="token punctuation">,</span>
        <span class="token property">&quot;entityidfilter&quot;</span><span class="token operator">:</span> <span class="token string">&quot;input_number.setpoint&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;entityidfiltertype&quot;</span><span class="token operator">:</span> <span class="token string">&quot;exact&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;outputinitially&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;state_type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;num&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;haltifstate&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;halt_if_type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;str&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;halt_if_compare&quot;</span><span class="token operator">:</span> <span class="token string">&quot;is&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;outputs&quot;</span><span class="token operator">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
        <span class="token property">&quot;output_only_on_state_change&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;for&quot;</span><span class="token operator">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
        <span class="token property">&quot;forType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;num&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;forUnits&quot;</span><span class="token operator">:</span> <span class="token string">&quot;minutes&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;ignorePrevStateNull&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;ignorePrevStateUnknown&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;ignorePrevStateUnavailable&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;ignoreCurrentStateUnknown&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;ignoreCurrentStateUnavailable&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;outputProperties&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">{</span>
                <span class="token property">&quot;property&quot;</span><span class="token operator">:</span> <span class="token string">&quot;payload.config.setpoint&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;propertyType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;msg&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;valueType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;entityState&quot;</span>
            <span class="token punctuation">}</span><span class="token punctuation">,</span>
            <span class="token punctuation">{</span>
                <span class="token property">&quot;property&quot;</span><span class="token operator">:</span> <span class="token string">&quot;data&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;propertyType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;msg&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;valueType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;eventData&quot;</span>
            <span class="token punctuation">}</span><span class="token punctuation">,</span>
            <span class="token punctuation">{</span>
                <span class="token property">&quot;property&quot;</span><span class="token operator">:</span> <span class="token string">&quot;topic&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;propertyType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;msg&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;value&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
                <span class="token property">&quot;valueType&quot;</span><span class="token operator">:</span> <span class="token string">&quot;triggerId&quot;</span>
            <span class="token punctuation">}</span>
        <span class="token punctuation">]</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">420</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">360</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">[</span>
                <span class="token string">&quot;b7b85590b7d28ba6&quot;</span>
            <span class="token punctuation">]</span>
        <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;b7b85590b7d28ba6&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;ps-strategy-heat-capacitor&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;135c4e7649611314&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Heat capacitor&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;timeHeat1C&quot;</span><span class="token operator">:</span> <span class="token string">&quot;70&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;timeCool1C&quot;</span><span class="token operator">:</span> <span class="token number">50</span><span class="token punctuation">,</span>
        <span class="token property">&quot;maxTempAdjustment&quot;</span><span class="token operator">:</span> <span class="token string">&quot;1&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;boostTempHeat&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;boostTempCool&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;minSavings&quot;</span><span class="token operator">:</span> <span class="token number">0.08</span><span class="token punctuation">,</span>
        <span class="token property">&quot;setpoint&quot;</span><span class="token operator">:</span> <span class="token number">23</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">600</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">320</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">[</span>
                <span class="token string">&quot;2b7cbdef3203a482&quot;</span>
            <span class="token punctuation">]</span><span class="token punctuation">,</span>
            <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
            <span class="token punctuation">[</span><span class="token punctuation">]</span>
        <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;2b7cbdef3203a482&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;function&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;z&quot;</span><span class="token operator">:</span> <span class="token string">&quot;135c4e7649611314&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Adjust setpoint&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;func&quot;</span><span class="token operator">:</span> <span class="token string">&quot;//In case the climate entity can only handle integers\\n//Calculate rounded setpoint for the climate entity and return the msg\\nmsg.adj_setpoint=Math.round(msg.payload);\\nreturn msg\\n&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;outputs&quot;</span><span class="token operator">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
        <span class="token property">&quot;noerr&quot;</span><span class="token operator">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
        <span class="token property">&quot;initialize&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;finalize&quot;</span><span class="token operator">:</span> <span class="token string">&quot;&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;libs&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
        <span class="token property">&quot;x&quot;</span><span class="token operator">:</span> <span class="token number">800</span><span class="token punctuation">,</span>
        <span class="token property">&quot;y&quot;</span><span class="token operator">:</span> <span class="token number">320</span><span class="token punctuation">,</span>
        <span class="token property">&quot;wires&quot;</span><span class="token operator">:</span> <span class="token punctuation">[</span>
            <span class="token punctuation">[</span>
                <span class="token string">&quot;4831f393a0066565&quot;</span>
            <span class="token punctuation">]</span>
        <span class="token punctuation">]</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;9ea07b03b88cb526&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;tibber-api-endpoint&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;feedUrl&quot;</span><span class="token operator">:</span> <span class="token string">&quot;wss://api.tibber.com/v1-beta/gql/subscriptions&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;queryUrl&quot;</span><span class="token operator">:</span> <span class="token string">&quot;https://api.tibber.com/v1-beta/gql&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Tibber&quot;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>
        <span class="token property">&quot;id&quot;</span><span class="token operator">:</span> <span class="token string">&quot;e2dd69fb.8f70a8&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;type&quot;</span><span class="token operator">:</span> <span class="token string">&quot;server&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;name&quot;</span><span class="token operator">:</span> <span class="token string">&quot;Home Assistant&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;version&quot;</span><span class="token operator">:</span> <span class="token number">2</span><span class="token punctuation">,</span>
        <span class="token property">&quot;addon&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;rejectUnauthorizedCerts&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;ha_boolean&quot;</span><span class="token operator">:</span> <span class="token string">&quot;y|yes|true|on|home|open&quot;</span><span class="token punctuation">,</span>
        <span class="token property">&quot;connectionDelay&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;cacheJson&quot;</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
        <span class="token property">&quot;heartbeat&quot;</span><span class="token operator">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
        <span class="token property">&quot;heartbeatInterval&quot;</span><span class="token operator">:</span> <span class="token number">30</span>
    <span class="token punctuation">}</span>
<span class="token punctuation">]</span>
</code></pre></div></details>`,5);function v(_,w){const t=p("RouterLink");return o(),e(r,null,[y,s("blockquote",null,[s("p",null,[d,g,m,u(t,{to:"/examples/example-cascade-temperature-control.html"},{default:c(()=>[b]),_:1}),h])]),f],64)}var S=i(q,[["render",v]]);export{S as default};
