package com.macarron.chat.server.config.type;

import org.hibernate.QueryException;
import org.hibernate.dialect.function.SQLFunction;
import org.hibernate.engine.spi.Mapping;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.type.StandardBasicTypes;
import org.hibernate.type.Type;

import java.util.List;

/**
 * function for extract date time like: extract(EPOCH FROM (select now())
 **/
public class ExtractEpochFunction implements SQLFunction {
    @Override
    public boolean hasArguments() {
        return true;
    }

    @Override
    public boolean hasParenthesesIfNoArguments() {
        return true;
    }

    @Override
    public Type getReturnType(Type firstArgumentType, Mapping mapping) throws QueryException {
        return StandardBasicTypes.DOUBLE;
    }

    @Override
    public String render(Type firstArgumentType, List args, SessionFactoryImplementor factory) throws QueryException {
        if (args.size() != 1) {
            throw new QueryException("extract() requires one argument1");
        }
        Object attr = args.get(0);

        return "extract(EPOCH from (" + attr + "))";
    }
}
