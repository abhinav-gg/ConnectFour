interface ITag {
  id: string;  // UUID
  name: string;
}
// Optional: If you need a class implementation
class Tag implements ITag {
  constructor(
    public id: string,
    public name: string,
  ) {}
}

export { Tag };

