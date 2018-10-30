# General helper functions.

# Returns true if two arrays are equal
def arrCompare(arr1, arr2):
    if (len(arr1) != len(arr2)): return False
    for i in range(0, len(arr1)):
        equal = arr1[i] == arr2[i] if type(arr1[i]) != type(arr1) else arrCompare(arr1[i], arr2[i])
        if (not equal): return False
    return True
