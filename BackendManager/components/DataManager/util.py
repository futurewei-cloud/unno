def check_input_manager(d_name, d, lst):
    for l in lst:
        if l not in d:
            raise ValueError("%s not in %s" % (l, d_name))

    return True

