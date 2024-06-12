
def sort_with_none(iterable, attrs: list[str], none_attr: str):
    # Elements ordre in attrs list matters (it determines which attribute will be sorted first).
    non_none_items = [item for item in iterable if getattr(item, none_attr) is not None]
    none_items = [item for item in iterable if getattr(item, none_attr) is None]
    non_none_items.sort(key = lambda x: [getattr(x, attr) for attr in attrs])
    return non_none_items + none_items