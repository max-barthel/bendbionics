"""Database helper functions for common CRUD operations."""

from typing import TypeVar

from sqlmodel import Session, SQLModel

T = TypeVar("T", bound=SQLModel)


def save_and_refresh(session: Session, obj: T) -> T:
    """Save an object to the database and refresh it.

    Args:
        session: Database session
        obj: SQLModel instance to save

    Returns:
        The saved and refreshed object
    """
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


def update_object(session: Session, obj: T, **updates) -> T:
    """Update an object with provided fields.

    Args:
        session: Database session
        obj: SQLModel instance to update
        **updates: Field names and values to update

    Returns:
        The updated object
    """
    for field, value in updates.items():
        if hasattr(obj, field) and value is not None:
            setattr(obj, field, value)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj
