interface IVisitor {
  visitMeeting(element: IElement): void;
  visitCall(element: IElement): void;
}

interface IElement {
  accept(visitor: IVisitor): void;
}

class Meeting implements IElement {
  public duration: number = 0;

  accept(visitor: IVisitor): void {
    visitor.visitMeeting(this);
  }
}

class Call implements IElement {
  accept(visitor: IVisitor): void {
    visitor.visitCall(this);
  }
}

class CalculoEstadisticas implements IVisitor {
  visitMeeting(element: Meeting): void {
    console.log('CalculoEstadisticas');
  }

  visitCall(element: Call): void {
    console.log('CalculoEstadisticas');
  }
}

class Main {
  static main() {
    const visitors = [new Meeting(), new Call()];

    for (const visitor of visitors) {
      visitor.accept(new CalculoEstadisticas());
    }
  }
}
