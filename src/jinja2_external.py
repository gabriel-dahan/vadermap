
def sort_with_none(iterable, attrs: list[str], none_attr: str):
    # Elements ordre in attrs list matters (it determines which attribute will be sorted first).
    non_none_items = []
    none_items = []
    for item in iterable:
        if None in [getattr(item, attr) for attr in attrs]:
            none_items.append(item)
        else:
            non_none_items.append(item)
    non_none_items.sort(key = lambda x: [getattr(x, attr) for attr in attrs])
    return non_none_items + none_items