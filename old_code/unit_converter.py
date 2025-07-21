class UnitConverter:
    """Converts units."""

    def __init__(self) -> None:
        pass

    @staticmethod
    def mm_to_m(length):
        """Converts mm into m."""
        return length * 10**-3

    @staticmethod
    def m_to_mm(length):
        """Converts m into mm."""
        return length * 10**3
