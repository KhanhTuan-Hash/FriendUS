import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'backend' / 'app'))

from richtext import RichText, TextFormat


def test_html_basic():
    text = RichText("Hello World", TextFormat.HTML)
    result = text.bold().render()
    print(f"✓ Bold HTML: {result}")
    assert "<b>" in result and "</b>" in result


def test_html_chain():
    text = RichText("Important", TextFormat.HTML)
    result = text.bold().italic().underline().render()
    print(f"✓ Chain HTML: {result}")
    assert "<b>" in result and "<i>" in result and "<u>" in result


def test_html_color():
    text = RichText("Red Text", TextFormat.HTML)
    result = text.color("#FF0000").render()
    print(f"✓ Color HTML: {result}")
    assert "#FF0000" in result and "color" in result


def test_html_size():
    text = RichText("Big", TextFormat.HTML)
    result = text.size(24).render()
    print(f"✓ Size HTML: {result}")
    assert "24px" in result


def test_html_font():
    text = RichText("Arial", TextFormat.HTML)
    result = text.font("Arial").render()
    print(f"✓ Font HTML: {result}")
    assert "Arial" in result


def test_html_multiple_styles():
    text = RichText("Styled", TextFormat.HTML)
    result = text.bold().color("#0000FF").size(16).render()
    print(f"✓ Multiple styles: {result}")
    assert "<b>" in result and "color" in result and "16px" in result


def test_markdown_basic():
    text = RichText("Hello", TextFormat.MARKDOWN)
    result = text.bold().render()
    print(f"✓ Bold Markdown: {result}")
    assert "**Hello**" == result


def test_markdown_italic():
    text = RichText("Italic", TextFormat.MARKDOWN)
    result = text.italic().render()
    print(f"✓ Italic Markdown: {result}")
    assert "*Italic*" == result


def test_markdown_chain():
    text = RichText("Text", TextFormat.MARKDOWN)
    result = text.bold().italic().render()
    print(f"✓ Chain Markdown: {result}")
    assert "***Text***" == result or "**_Text_**" in result or "***Text***" == result


def test_str_representation():
    text = RichText("Test", TextFormat.HTML)
    text.bold()
    result = str(text)
    print(f"✓ String conversion: {result}")
    assert "<b>" in result


def test_repr():
    text = RichText("Test", TextFormat.HTML)
    result = repr(text)
    print(f"✓ Repr: {result}")
    assert "RichText" in result


if __name__ == "__main__":
    print("=" * 50)
    print("Testing RichText Module")
    print("=" * 50)
    
    try:
        test_html_basic()
        test_html_chain()
        test_html_color()
        test_html_size()
        test_html_font()
        test_html_multiple_styles()
        test_markdown_basic()
        test_markdown_italic()
        test_markdown_chain()
        test_str_representation()
        test_repr()
        
        print("=" * 50)
        print("✅ All RichText tests passed!")
        print("=" * 50)
    except AssertionError as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
