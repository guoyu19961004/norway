<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="text()">
  <xsl:apply-templates/>
</xsl:template>
<xsl:template match="*[namespace-uri() = 'http://www.w3.org/1999/xhtml' and @* and node()]">
  <code class="node">
    <code class="taghead">
      <code class="lessthan">&lt;</code>
      <code class="nodename"><xsl:value-of select="name()" /></code>
      <xsl:for-each select="@*">
        <code class="space">&#8194;</code>
        <code class="attrname"><xsl:value-of select="name()" /></code>
        <code class="equal">=</code>
        <code class="quote">"</code>
        <code class="attrvalue"><xsl:value-of select="." /></code>
        <code class="quote">"</code>
      </xsl:for-each>
    <code class="greaterthan">&gt;</code>
    </code>

    <code class="child">
      <xsl:choose>
        <xsl:when test="*">
          <xsl:apply-templates/>
        </xsl:when>
        <xsl:otherwise>
          <code class="text">
            <xsl:value-of select="." />
          </code>
        </xsl:otherwise>
      </xsl:choose>
    </code>

    <code class="tagtail">
      <code class="lessthan">&lt;</code>
      <code class="backslant">/</code>
      <code class="nodename"><xsl:value-of select="name()" /></code>
      <code class="greaterthan">&gt;</code>
    </code>
  </code>
</xsl:template>
<xsl:template match="*[namespace-uri() = 'http://www.w3.org/1999/xhtml' and @* and not(node())]">
  <code class="node">
    <code class="tag">
      <code class="lessthan">&lt;</code>
      <code class="nodename"><xsl:value-of select="name()" /></code>
      <xsl:for-each select="@*">
        <code class="space">&#8194;</code>
        <code class="attrname"><xsl:value-of select="name()" /></code>
        <code class="equal">=</code>
        <code class="quote">"</code>
        <code class="attrvalue"><xsl:value-of select="." /></code>
        <code class="quote">"</code>
      </xsl:for-each>
      <code class="space">&#8194;</code>
      <code class="backslant">/</code>
      <code class="greaterthan">&gt;</code>
    </code>
  </code>
</xsl:template>

<xsl:template match="*[namespace-uri() = 'http://www.w3.org/1999/xhtml' and not(@*) and node()]">
  <code class="node">
    <code class="taghead">
      <code class="lessthan">&lt;</code>
      <code class="nodename"><xsl:value-of select="name()" /></code>
      <code class="greaterthan">&gt;</code>
    </code>

    <code class="child">
      <xsl:choose>
        <xsl:when test="*">
          <xsl:apply-templates/>
        </xsl:when>
        <xsl:otherwise>
          <code class="text">
            <xsl:value-of select="." />
          </code>
        </xsl:otherwise>
      </xsl:choose>
    </code>

    <code class="tagtail">
      <code class="lessthan">&lt;</code>
      <code class="backslant">/</code>
      <code class="nodename"><xsl:value-of select="name()" /></code>
      <code class="greaterthan">&gt;</code>
    </code>
  </code>
</xsl:template>

<xsl:template match="*[namespace-uri() = 'http://www.w3.org/1999/xhtml' and not(@*) and not(node())]">
  <code class="node">
    <code class="tag">
      <code class="lessthan">&lt;</code>
      <code class="nodename"><xsl:value-of select="name()" /></code>
      <code class="backslant">/</code>
      <code class="greaterthan">&gt;</code>
    </code>
  </code>
</xsl:template>
<xsl:template match="instance">
  <div class="instance">
    <xsl:for-each select="node()[not(name() = '')]">
    <xsl:choose>
      <xsl:when test="name() = 'link'">
        <a class="link" target="_blank" href="{text()}"><xsl:value-of select="text()" /></a>
      </xsl:when>
      <xsl:otherwise>
        <code class="node">
          <code class="taghead">
            <code class="lessthan">&lt;</code>
            <code class="nodename"><xsl:value-of select="name()" /></code>
            <code class="greaterthan">&gt;</code>
          </code>

          <code class="child">
            <xsl:choose>
              <xsl:when test="*">
                <xsl:apply-templates/>
              </xsl:when>
              <xsl:otherwise>
                <code class="text">
                  <xsl:value-of select="." />
                </code>
              </xsl:otherwise>
            </xsl:choose>
          </code>

          <code class="tagtail">
            <code class="lessthan">&lt;</code>
            <code class="backslant">/</code>
            <code class="nodename"><xsl:value-of select="name()" /></code>
            <code class="greaterthan">&gt;</code>
          </code>
        </code>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:for-each>
  </div>
</xsl:template>
<xsl:template match="item">
  <li>
    <xsl:value-of select="description" />(<xsl:value-of select="count(instance)" />)
  </li>
  <div class="item">
    <xsl:apply-templates/>
  </div>
</xsl:template>
<xsl:template match="field">
  <ul class="field">
    <span class="name">
      <xsl:value-of select="name" />
    </span>
    <xsl:apply-templates/>
  </ul>
</xsl:template>

</xsl:stylesheet>