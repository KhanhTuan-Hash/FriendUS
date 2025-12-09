from enum import Enum
from typing import Optional


class TextFormat(Enum):
    HTML = "html"
    MARKDOWN = "markdown"


class RichText:
    def __init__(self, text: str, output_format: TextFormat = TextFormat.HTML):
        self.text = text
        self.output_format = output_format
        self._styles = []
    
    def bold(self):
        self._add_style('bold')
        return self
    
    def italic(self):
        self._add_style('italic')
        return self
    
    def underline(self):
        self._add_style('underline')
        return self
    
    def color(self, hex_color: str):
        self._add_style(('color', hex_color))
        return self
    
    def size(self, px: int):
        self._add_style(('size', px))
        return self
    
    def font(self, font_name: str):
        self._add_style(('font', font_name))
        return self
    
    def _add_style(self, style):
        self._styles.append(style)
        return self
    
    def render(self) -> str:
        if self.output_format == TextFormat.HTML:
            return self._render_html()
        elif self.output_format == TextFormat.MARKDOWN:
            return self._render_markdown()
        return self.text
    
    def _render_html(self) -> str:
        result = self.text
        style_attrs = []
        html_tags = []
        
        for style in self._styles:
            if isinstance(style, str):
                if style == 'bold':
                    html_tags.append(('b', 'b'))
                elif style == 'italic':
                    html_tags.append(('i', 'i'))
                elif style == 'underline':
                    html_tags.append(('u', 'u'))
            elif isinstance(style, tuple):
                key, value = style
                if key == 'color':
                    style_attrs.append(f"color: {value}")
                elif key == 'size':
                    style_attrs.append(f"font-size: {value}px")
                elif key == 'font':
                    style_attrs.append(f"font-family: {value}")
        
        for tag, _ in html_tags:
            result = f"<{tag}>{result}</{tag}>"
        
        if style_attrs:
            style_str = "; ".join(style_attrs)
            result = f"<span style='{style_str}'>{result}</span>"
        
        return result
    
    def _render_markdown(self) -> str:
        result = self.text
        
        for style in self._styles:
            if isinstance(style, str):
                if style == 'bold':
                    result = f"**{result}**"
                elif style == 'italic':
                    result = f"*{result}*"
                elif style == 'underline':
                    result = f"__{result}__"
        
        return result
    
    def __str__(self):
        return self.render()
    
    def __repr__(self):
        return f"RichText('{self.text}', format={self.output_format.value})"
