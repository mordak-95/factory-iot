from models import Base, get_engine

if __name__ == '__main__':
    print('Creating all tables...')
    engine = get_engine()
    Base.metadata.create_all(engine)
    print('Done.') 